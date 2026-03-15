/**
 * Returns the display tag for a job.
 * - If admin set a tag (e.g. "Urgent"), use that.
 * - Otherwise, if the job was created within the last 7 days, show "New".
 */
export function getJobDisplayTag(tag: string | null, createdAt: string): string | null {
  if (tag) return tag;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7 ? "New" : null;
}
