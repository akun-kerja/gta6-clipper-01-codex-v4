import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const input = join(botDir, 'VIDEO.json');

function youtubeVideoId(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be') {
    const match = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/);
    return match?.[1] ?? null;
  }
  if (host !== 'youtube.com' && host !== 'www.youtube.com' && host !== 'm.youtube.com') return null;

  if (url.pathname === '/watch') {
    const ids = url.searchParams.getAll('v');
    return ids.length === 1 && /^[A-Za-z0-9_-]{11}$/.test(ids[0]) ? ids[0] : null;
  }
  const match = url.pathname.match(/^\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{11})\/?$/);
  return match?.[1] ?? null;
}

let video;
try {
  video = JSON.parse(readFileSync(input, 'utf8'));
} catch (error) {
  console.error(`VIDEO.json could not be read from ${input}: ${error.message}`);
  process.exit(1);
}

if (!video || typeof video.url !== 'string' || youtubeVideoId(video.url) === null) {
  console.error('VIDEO.json must contain a valid HTTPS YouTube URL with an 11-character video ID.');
  process.exit(1);
}

try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(input, join(outputDir, 'VIDEO.json'));
} catch (error) {
  console.error(`VIDEO.json could not be copied to ${outputDir}: ${error.message}`);
  process.exit(1);
}
