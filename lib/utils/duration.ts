/** "45 min" / "1 hr 5 min" for card and detail meta rows. */
export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '';

  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

/** "24:15" / "1:04:00" for the Continue Listening elapsed / total row. */
export function formatClock(seconds?: number | null): string {
  const safe = Math.max(0, Math.floor(seconds ?? 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const paddedSecs = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
  }

  return `${minutes}:${paddedSecs}`;
}

/** "1.2k plays" style counts for the soundscape detail meta row. */
export function formatCount(value?: number | null): string {
  if (value === null || value === undefined || value < 0) return '';
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1)}k`;
  }
  const millions = value / 1_000_000;
  return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}m`;
}
