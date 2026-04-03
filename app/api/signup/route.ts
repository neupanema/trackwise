import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  // check all fields filled
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // check if email already exists
  const { data: existingUser } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 400 }
    );
  }

  // encrypt password
  const hashedPassword = await bcrypt.hash(password, 10);

  // save to database
  const { data, error } = await supabase
    .from("User")
    .insert([{ name, email, password: hashedPassword }])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Account created successfully!", user: data },
    { status: 201 }
  );
}