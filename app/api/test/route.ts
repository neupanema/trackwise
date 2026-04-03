import { supabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("User")
    .select("*")
    .limit(1);

  if (error) {
    return NextResponse.json({ 
      status: "❌ Connection failed", 
      error 
    });
  }

  return NextResponse.json({ 
    status: "✅ Database connected successfully!",
    data 
  });
}