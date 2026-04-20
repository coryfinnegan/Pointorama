import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

function getImagesDir() {
  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "pointorama.db");
  return path.join(path.dirname(dbPath), "images");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dir = getImagesDir();
  const filepath = path.join(dir, filename);

  if (!fs.existsSync(filepath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  const contentType = mimeMap[ext] ?? "application/octet-stream";
  const buffer = fs.readFileSync(filepath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
