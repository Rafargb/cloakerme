import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { getUploadsDir } from './db';

export interface CreativeProcessOptions {
  intensity: number; // 1 to 10
  protection: 'basic' | 'white_overlay' | 'advanced';
  noise_start: boolean;
  noise_end: boolean;
  overlay: boolean;
  flashes: boolean;
  color_shift: boolean;
  audio_cloak: boolean;
  distractor_overlay: boolean;
  audio_replace: boolean;
  micro_crop: boolean;
  speed_shift: boolean;
  flip_h: boolean;
  tiktok: boolean;
}

export function getFfmpegBinary(): string | null {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    return ffmpegStatic;
  }
  const candidates = [
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function probeVideo(ffmpegBin: string, filePath: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve) => {
    const proc = spawn(ffmpegBin, ['-i', filePath], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('close', () => {
      const durM = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      const dimM = stderr.match(/Stream.*Video:.*,\s*(\d{2,5})x(\d{2,5})/);
      resolve({
        duration: durM ? parseFloat(durM[1]) * 3600 + parseFloat(durM[2]) * 60 + parseFloat(durM[3]) : 0,
        width: dimM ? parseInt(dimM[1], 10) : 1080,
        height: dimM ? parseInt(dimM[2], 10) : 1920,
      });
    });
  });
}

function runFfmpeg(ffmpegBin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-400)}`));
    });
  });
}

export async function processCreativeFile(
  buffer: Buffer,
  originalName: string,
  options: CreativeProcessOptions,
  distractorFileId: string | null
): Promise<{
  fileId: string;
  newName: string;
  format: string;
  originalSize: number;
  newSize: number;
  hash: string;
}> {
  const uploadsDir = getUploadsDir();
  const extMatch = path.extname(originalName).toLowerCase().replace('.', '');
  const format = extMatch || 'mp4';
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(format);
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format);

  const fileId = `cmv${crypto.randomBytes(10).toString('hex')}`;
  const uuidName = `${crypto.randomUUID()}.${format}`;
  const tempInputPath = path.join(uploadsDir, `${fileId}_in.${format}`);
  const finalOutputPath = path.join(uploadsDir, `${fileId}.${format}`);

  fs.writeFileSync(tempInputPath, buffer);

  const ffmpegBin = getFfmpegBinary();
  const intensityNorm = Math.max(1, Math.min(10, Number(options.intensity) || 5));

  // Cloakby real assets (nature cover + floral distractor)
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  const defaultCoverNature = path.join(assetsDir, 'cover_nature.png');
  const defaultCoverTexture = path.join(assetsDir, 'cover_texture.png');
  const defaultDistractor = path.join(assetsDir, 'cmvnkaciq002uu7n7ahuxf1x3.png');

  const coverPath = fs.existsSync(defaultCoverNature)
    ? defaultCoverNature
    : fs.existsSync(defaultCoverTexture)
    ? defaultCoverTexture
    : null;

  let activeDistractorPath: string | null = null;
  if (distractorFileId) {
    const customDist = path.join(uploadsDir, `${distractorFileId}.png`);
    if (fs.existsSync(customDist)) activeDistractorPath = customDist;
  }
  if (!activeDistractorPath && fs.existsSync(defaultDistractor)) {
    activeDistractorPath = defaultDistractor;
  }

  if (ffmpegBin && isVideo) {
    try {
      const probe = await probeVideo(ffmpegBin, tempInputPath);
      // Ensure dimensions are even numbers (h264 requirement) and apply micro-crop
      const cropW = options.micro_crop ? (probe.width % 2 !== 0 ? probe.width - 1 : probe.width - 2) : (probe.width - (probe.width % 2));
      const cropH = options.micro_crop ? (probe.height % 2 !== 0 ? probe.height - 1 : probe.height - 2) : (probe.height - (probe.height % 2));

      const args: string[] = ['-y', '-i', tempInputPath];
      let coverStreamIdx: number | null = null;
      let distractorStreamIdx: number | null = null;
      let streamCount = 1;

      if ((options.noise_start || options.noise_end) && coverPath) {
        args.push('-loop', '1', '-i', coverPath);
        coverStreamIdx = streamCount++;
      }

      if ((options.overlay || options.distractor_overlay) && activeDistractorPath) {
        args.push('-loop', '1', '-i', activeDistractorPath);
        distractorStreamIdx = streamCount++;
      }

      const complexGraph: string[] = [];

      // 1. Base video transform
      const baseFilters: string[] = [];
      if (options.micro_crop) {
        baseFilters.push(`crop=${cropW}:${cropH}`);
      } else {
        baseFilters.push(`scale=trunc(iw/2)*2:trunc(ih/2)*2`);
      }

      if (options.flip_h) {
        baseFilters.push('hflip');
      }

      // Anti-NSFW and skin tone frequency adjustment (white_overlay / advanced)
      if (options.protection === 'white_overlay' || options.protection === 'advanced') {
        baseFilters.push('eq=brightness=0.015:contrast=0.975:saturation=0.98');
      } else if (options.color_shift) {
        const b = (0.005 * (intensityNorm % 2 === 0 ? 1 : -1)).toFixed(3);
        baseFilters.push(`eq=brightness=${b}:contrast=0.985:saturation=1.02`);
      }

      if (options.flashes) {
        baseFilters.push('eq=brightness=0.03:enable=between(t\\,1.4\\,1.44)+between(t\\,3.8\\,3.84)');
      }

      if (options.speed_shift || options.tiktok) {
        const speed = options.tiktok ? 1.025 : 1 + intensityNorm * 0.003;
        const pts = (1 / speed).toFixed(5);
        baseFilters.push(`setpts=${pts}*PTS`);
      }

      complexGraph.push(`[0:v]${baseFilters.join(',')}[base]`);
      let currentOut = '[base]';

      // 2. Distractor pattern overlay (alpha 3% - 5%)
      if (distractorStreamIdx !== null) {
        const alpha = (0.025 + intensityNorm * 0.003).toFixed(3);
        complexGraph.push(`[${distractorStreamIdx}:v]scale=${cropW}:${cropH},format=yuva420p,colorchannelmixer=aa=${alpha}[dist]`);
        complexGraph.push(`${currentOut}[dist]overlay=0:0:shortest=1[with_dist]`);
        currentOut = '[with_dist]';
      }

      // 3. Safe cover frame (3 frames = ~100ms)
      if (coverStreamIdx !== null) {
        complexGraph.push(`[${coverStreamIdx}:v]scale=${cropW}:${cropH}[cov]`);
        const enableConds: string[] = [];
        if (options.noise_start) {
          enableConds.push('lt(t\\,0.10)');
        }
        if (options.noise_end && probe.duration > 1) {
          const endThreshold = Math.max(0.1, probe.duration - 0.10).toFixed(2);
          enableConds.push(`gt(t\\,${endThreshold})`);
        }
        const enableExpr = enableConds.join('+');
        complexGraph.push(`${currentOut}[cov]overlay=0:0:shortest=1:enable=${enableExpr}[with_cov]`);
        currentOut = '[with_cov]';
      }

      args.push('-filter_complex', complexGraph.join(';'));
      args.push('-map', currentOut);

      // Audio handling
      const afFilters: string[] = [];
      if (options.speed_shift || options.tiktok) {
        const speed = options.tiktok ? 1.025 : 1 + intensityNorm * 0.003;
        afFilters.push(`atempo=${speed.toFixed(3)}`);
      }
      if (options.audio_cloak || options.audio_replace) {
        afFilters.push('equalizer=f=1000:t=q:w=1:g=0.5,volume=0.98');
      }

      if (afFilters.length > 0) {
        args.push('-af', afFilters.join(','));
      }
      args.push('-map', '0:a?');

      // Fast encoding matching Cloakby original specs
      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '25',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
        '-map_metadata', '-1',
        '-metadata', `comment=cb_${crypto.randomBytes(6).toString('hex')}`
      );

      args.push(finalOutputPath);
      await runFfmpeg(ffmpegBin, args);
    } catch (err: any) {
      console.error('FFmpeg video process error:', err);
      const entropy = Buffer.from(`\n<!-- cb:${crypto.randomUUID()}:${Date.now()} -->`);
      fs.writeFileSync(finalOutputPath, Buffer.concat([buffer, entropy]));
    }
  } else if (ffmpegBin && isImage) {
    try {
      const vf: string[] = [];
      if (options.micro_crop) vf.push('crop=iw-2:ih-2');
      if (options.flip_h) vf.push('hflip');
      if (options.protection === 'white_overlay' || options.protection === 'advanced') {
        vf.push('eq=brightness=0.015:contrast=0.975:saturation=0.98');
      } else if (options.color_shift) {
        vf.push('eq=brightness=0.005:contrast=0.985:saturation=1.02');
      }

      const args: string[] = ['-y', '-i', tempInputPath, '-map_metadata', '-1'];
      if (vf.length > 0) args.push('-vf', vf.join(','));
      args.push(finalOutputPath);
      await runFfmpeg(ffmpegBin, args);
    } catch {
      const entropy = Buffer.from(`\n<!-- cb:${crypto.randomUUID()}:${Date.now()} -->`);
      fs.writeFileSync(finalOutputPath, Buffer.concat([buffer, entropy]));
    }
  } else {
    const entropy = Buffer.from(`\n<!-- cb:${crypto.randomUUID()}:${Date.now()} -->`);
    fs.writeFileSync(finalOutputPath, Buffer.concat([buffer, entropy]));
  }

  try {
    if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
  } catch {}

  const outputBuffer = fs.readFileSync(finalOutputPath);
  const hash = crypto.createHash('sha256').update(outputBuffer).digest('hex');

  return {
    fileId,
    newName: uuidName,
    format,
    originalSize: buffer.length,
    newSize: outputBuffer.length,
    hash,
  };
}
