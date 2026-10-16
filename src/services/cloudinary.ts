import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { MediaItem } from '@/types';

// Free Cloudinary tier with an UNSIGNED upload preset: no secret on the device.
const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = !!cloud && !!preset;

export interface LocalMedia {
  uri: string;
  type: 'image' | 'video';
  /** set once uploaded, so retries don't upload twice */
  url?: string;
}

/**
 * Resize to max 1600px wide and JPEG 70% — keeps uploads ~200–400 KB on mobile data.
 * If the manipulator fails on some device/format, upload the original instead.
 */
async function compressImage(uri: string): Promise<{ uri: string; compressed: boolean }> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width: 1600 });
    const image = await ctx.renderAsync();
    const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return { uri: result.uri, compressed: true };
  } catch (e) {
    console.warn('[CivicConnect] image compression failed, uploading original', e);
    return { uri, compressed: false };
  }
}

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', mp4: 'video/mp4', mov: 'video/quicktime', '3gp': 'video/3gpp' };

function filePart(uri: string, type: LocalMedia['type'], compressed: boolean) {
  const ext = compressed ? 'jpg' : (uri.split('?')[0]!.split('.').pop() ?? '').toLowerCase();
  const mime = MIME[ext] ?? (type === 'image' ? 'image/jpeg' : 'video/mp4');
  return { uri, name: `upload.${MIME[ext] ? ext : type === 'image' ? 'jpg' : 'mp4'}`, type: mime };
}

/**
 * Expo SDK 57 replaces global `fetch` with expo/fetch, which rejects React
 * Native `{ uri }` file parts ("Unsupported FormDataPart implementation").
 * React Native's XMLHttpRequest still streams them from disk, so use that.
 */
function postOnce(url: string, part: ReturnType<typeof filePart>): Promise<{ ok: boolean; status: number; text: string }> {
  const form = new FormData();
  form.append('file', part as unknown as Blob);
  form.append('upload_preset', preset!);
  form.append('folder', 'civicconnect');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 120_000;
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: xhr.responseText });
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.send(form);
  });
}

export async function uploadMedia(item: LocalMedia): Promise<MediaItem> {
  if (item.url) return { url: item.url, type: item.type };
  if (!cloudinaryConfigured) throw Object.assign(new Error('Cloudinary not configured'), { code: 'cloudinary/not-configured' });

  const { uri, compressed } = item.type === 'image' ? await compressImage(item.uri) : { uri: item.uri, compressed: false };
  const part = filePart(uri, item.type, compressed);
  const url = `https://api.cloudinary.com/v1_1/${cloud}/${item.type === 'video' ? 'video' : 'image'}/upload`;

  let res: Awaited<ReturnType<typeof postOnce>>;
  try {
    res = await postOnce(url, part);
  } catch {
    // "Network request failed" on a flaky mobile connection: one retry.
    await new Promise((r) => setTimeout(r, 1500));
    try {
      res = await postOnce(url, part);
    } catch (e) {
      throw Object.assign(new Error(`Network error while uploading: ${(e as Error)?.message ?? e}`), { code: 'cloudinary/upload-failed' });
    }
  }
  const text = res.text;
  let json: { secure_url?: string; error?: { message: string } } = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok || !json.secure_url) {
    throw Object.assign(new Error(`Cloudinary ${res.status}: ${json.error?.message ?? text.slice(0, 120)}`), { code: 'cloudinary/upload-failed' });
  }
  return { url: json.secure_url, type: item.type };
}

/** Uploads sequentially (gentler on slow connections); returns uploaded items in order. */
export async function uploadAll(items: LocalMedia[], onProgress?: (done: number, total: number) => void): Promise<MediaItem[]> {
  const out: MediaItem[] = [];
  for (const [i, item] of items.entries()) {
    out.push(await uploadMedia(item));
    onProgress?.(i + 1, items.length);
  }
  return out;
}

/** Smaller Cloudinary rendition for thumbnails (transformations are free). */
export function thumb(url: string, width = 400): string {
  if (!url.includes('/upload/')) return url;
  const t = url.includes('/video/upload/') ? `w_${width},so_0,f_jpg` : `w_${width},q_auto,f_auto`;
  const out = url.replace('/upload/', `/upload/${t}/`);
  return url.includes('/video/upload/') ? out.replace(/\.\w+$/, '.jpg') : out;
}
