import { NextRequest, NextResponse } from 'next/server';
import { generateId, readDb, writeDb } from '@/lib/db';
import {
  CreativeProcessOptions,
  getFfmpegBinary,
  processCreativeFile,
} from '@/lib/creative-processor';

function enrichCreative(c: any) {
  const fmt = String(c.format || '').toLowerCase();
  const isVideo = ['mp4', 'webm', 'mov'].includes(fmt) || String(c.originalName || '').match(/\.(mp4|webm|mov)$/i);
  return {
    ...c,
    name: c.name || c.newName || c.originalName || 'Criativo',
    url: c.url || c.fileUrl,
    type: c.type || (isVideo ? 'video' : 'image'),
    sha256: c.sha256 || c.hash,
  };
}

export async function GET() {
  const db = readDb();
  const ffmpegAvailable = Boolean(getFfmpegBinary());
  const enriched = db.creatives.map(enrichCreative);
  return NextResponse.json({
    data: enriched,
    meta: {
      ffmpeg: ffmpegAvailable,
      whiteAudios: 3,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: { message: 'Nenhum arquivo enviado.' }, message: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const parseBool = (key: string, fallback = false) => {
      const val = formData.get(key);
      if (val === null) return fallback;
      return String(val) === 'true';
    };

    const options: CreativeProcessOptions = {
      intensity: Number(formData.get('intensity') ?? 5),
      protection: String(formData.get('protection') || 'basic') as any,
      noise_start: parseBool('noise_start', true),
      noise_end: parseBool('noise_end', false),
      overlay: parseBool('overlay', true),
      flashes: parseBool('flashes', true),
      color_shift: parseBool('color_shift', true),
      audio_cloak: parseBool('audio_cloak', true),
      distractor_overlay: parseBool('distractor_overlay', true),
      audio_replace: parseBool('audio_replace', false),
      micro_crop: parseBool('micro_crop', true),
      speed_shift: parseBool('speed_shift', true),
      flip_h: parseBool('flip_h', false),
      tiktok: parseBool('tiktok', false),
    };

    const db = readDb();
    const createdRecords = [];

    for (const file of files) {
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const processed = await processCreativeFile(
        buffer,
        file.name,
        options,
        db.distractorFileId
      );

      const record = enrichCreative({
        id: generateId('cmv'),
        userId: db.user.id,
        originalName: file.name,
        newName: processed.newName,
        fileUrl: `/api/v1/files/${processed.fileId}`,
        format: processed.format,
        originalSize: processed.originalSize,
        newSize: processed.newSize,
        hash: processed.hash,
        fileId: processed.fileId,
        appliedOptions: options,
        createdAt: new Date().toISOString(),
      });

      db.creatives.unshift(record);
      createdRecords.push(record);
    }

    writeDb(db);
    return NextResponse.json({ data: createdRecords });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: { message: err?.message || 'Erro ao processar criativo.' },
        message: err?.message || 'Erro ao processar criativo.',
      },
      { status: 500 }
    );
  }
}
