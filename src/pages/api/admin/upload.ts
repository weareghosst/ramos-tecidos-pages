import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function bufferFromBase64(base64: string) {
  return Buffer.from(base64, "base64");
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { filename, contentType, fileBase64 } = req.body as {
    filename: string;
    contentType: string;
    fileBase64: string;
  };

  if (!filename || !contentType || !fileBase64) {
    return res.status(400).json({ error: "Arquivo inválido" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const ext = filename.split(".").pop() || "png";
  const finalName = `${Date.now()}-${safeFileName(filename)}`;
  const path = `variants/${finalName}.${ext}`.replace(`.${ext}.${ext}`, `.${ext}`);

  const fileBuffer = bufferFromBase64(fileBase64);

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);

  return res.status(200).json({
    success: true,
    url: data.publicUrl,
  });
}