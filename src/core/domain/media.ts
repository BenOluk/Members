import { safeUrl } from './validation';

export type VideoSource = { kind: 'embed' | 'video'; url: string } | null;

export function videoSource(value: string): VideoSource {
  if (!safeUrl(value)) return null;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? { kind: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}?rel=0` } : null;
  }
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-f0-9]+))?\/?$/);
    if (!match) return null;
    const privacyHash = match[2] ?? url.searchParams.get('h');
    const suffix = privacyHash && /^[a-f0-9]+$/.test(privacyHash) ? `?h=${privacyHash}` : '';
    return { kind: 'embed', url: `https://player.vimeo.com/video/${match[1]}${suffix}` };
  }
  return /\.(mp4|webm|ogg)$/i.test(url.pathname) ? { kind: 'video', url: value } : null;
}
