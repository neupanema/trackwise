import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { imageBase64, fileType } = await req.json();

  if (!imageBase64 || !fileType) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer     = Buffer.from(base64Data, "base64");
  const fileExt    = fileType.split("/")[1];

  // add timestamp to filename to prevent caching
  const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, buffer, {
      contentType: fileType,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // add cache-busting query param so browser always loads fresh
  const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("User")
    .update({ image: imageUrl })
    .eq("id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ imageUrl });
}