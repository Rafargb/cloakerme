import { NextRequest, NextResponse } from 'next/server';
import { cloakText } from '@/lib/text-cloaker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? '');
    const rawIntensity = Number(body?.intensity ?? 100);
    const pctIntensity = rawIntensity <= 1 ? Math.round(rawIntensity * 100) : Math.round(rawIntensity);
    const result = cloakText(text, pctIntensity);

    const zeroWidthCount = (result.match(/[\u200B\u200C\u200D\u2060]/g) || []).length;
    let replacedChars = 0;
    const stripped = result.replace(/[\u200B\u200C\u200D\u2060]/g, '');
    for (let i = 0; i < Math.min(text.length, stripped.length); i++) {
      if (text[i] !== stripped[i]) replacedChars++;
    }

    return NextResponse.json({
      cloaked: result,
      result,
      stats: {
        originalLength: text.length,
        cloakedLength: result.length,
        replacedChars,
        zeroWidthInserted: zeroWidthCount,
      },
      data: {
        result,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'Falha ao camuflar texto.' } },
      { status: 400 }
    );
  }
}
