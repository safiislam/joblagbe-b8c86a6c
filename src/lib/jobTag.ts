/**
 * Returns the display tag for content.
 * - If admin set a tag (e.g. "Urgent"), use that.
 * - Otherwise, if created within the last 24 hours, show "New".
 */
export function getJobDisplayTag(tag: string | null, createdAt: string): string | null {
  if (tag) return tag;
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return hours <= 24 ? "New" : null;
}
