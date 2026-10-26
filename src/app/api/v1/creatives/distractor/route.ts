import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { generateId, getUploadsDir, readDb, writeDb } from '@/lib/db';

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    configured: Boolean(db.distractorUrl),
    url: db.distractorUrl,
    data: {
      url: db.distractorUrl,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: { message: 'Nenhuma imagem enviada.' }, message: 'Nenhuma imagem enviada.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase().replace('.', '') || 'png';
    const fileId = generateId('dist_');
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, `${fileId}.${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const db = readDb();
    db.distractorFileId = `${fileId}.${ext}`;
    db.distractorUrl = `/api/v1/files/${fileId}`;
    writeDb(db);

    return NextResponse.json({
      configured: true,
      url: db.distractorUrl,
      data: {
        url: db.distractorUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'Falha ao enviar imagem distratora.' } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const db = readDb();
  if (db.distractorFileId) {
    const filePath = path.join(getUploadsDir(), db.distractorFileId);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  }
  db.distractorFileId = null;
  db.distractorUrl = null;
  writeDb(db);
  return NextResponse.json({ configured: false, url: null, data: { removed: true } });
}
