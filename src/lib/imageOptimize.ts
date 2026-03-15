/**
 * Transform a Supabase Storage public URL to use the image transformation API.
 * Returns the original URL unchanged if it's not a Supabase storage URL.
 *
 * @param url  - Original public storage URL
 * @param opts - width, height, quality (default 75)
 */
export function optimizeStorageImage(
  url: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return "";

  // Only transform Supabase storage URLs
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const base = url.substring(0, idx);
  const path = url.substring(idx + marker.length);

  // Strip any existing query string from the path for a clean render URL
  const cleanPath = path.split("?")[0];

  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  params.set("quality", String(opts.quality ?? 75));

  return `${base}/storage/v1/render/image/public/${cleanPath}?${params.toString()}`;
}
