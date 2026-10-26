import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getUploadsDir, readDb } from "@/lib/db";

const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  html: "text/html; charset=utf-8",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uploadsDir = getUploadsDir();
  const download = req.nextUrl.searchParams.get("download") === "1";

  // Find matching file in uploads directory
  const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
  const matched = files.find((f) => f === id || f.startsWith(`${id}.`));

  const db = readDb();
  const creative = db.creatives.find((c) => c.fileId === id || c.id === id);

  if (matched) {
    const fullPath = path.join(uploadsDir, matched);
    const ext = path.extname(matched).toLowerCase().replace(".", "");
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const data = fs.readFileSync(fullPath);
    const downloadName = creative?.newName || matched;

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.length),
        ...(download
          ? { "Content-Disposition": `attachment; filename="${downloadName}"` }
          : {}),
      },
    });
  }

  // Check if it's a stored HTML page
  const page = db.pages.find((p) => p.fileId === id);
  if (page && page.html) {
    return new NextResponse(page.html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // If it's one of the pre-seeded remote creatives from the user's account, show an informative preview page with link to remote or local info
  if (creative) {
    const html = `<!doctype html>
<html lang="pt-BR" style="background:#080808;color:#f5f5f4;font-family:system-ui,sans-serif;">
<head><meta charset="utf-8"/><title>${creative.newName}</title></head>
<body style="display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;">
  <div style="max-width:520px;width:100%;border:1px solid rgba(255,255,255,0.1);background:#101010;border-radius:16px;padding:28px;">
    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#f97316;font-weight:700;">Metadados do Criativo</p>
    <h1 style="margin:8px 0 4px;font-size:20px;word-break:break-all;">${creative.newName}</h1>
    <p style="margin:0 0 18px;font-size:13px;color:rgba(255,255,255,0.45);">Original: ${creative.originalName}</p>
    <div style="border:1px solid rgba(255,255,255,0.07);background:rgba(0,0,0,0.35);border-radius:12px;padding:14px;font-family:monospace;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6;word-break:break-all;">
      <div><strong>Formato:</strong> ${creative.format.toUpperCase()}</div>
      <div><strong>Tamanho Original:</strong> ${(creative.originalSize / 1024 / 1024).toFixed(2)} MB</div>
      <div><strong>Tamanho Processado:</strong> ${(creative.newSize / 1024 / 1024).toFixed(2)} MB</div>
      <div><strong>SHA-256 Hash:</strong> ${creative.hash}</div>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Este item foi importado do histórico da sua conta Cloakby. Todos os novos arquivos enviados por você no painel ficam salvos localmente em <code>data/uploads/</code> prontos para visualização e download direto.</p>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(
    { error: { message: "Arquivo não encontrado." } },
    { status: 404 }
  );
}
