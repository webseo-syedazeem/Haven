const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Human readable file size — "0 B" for nothing, one decimal past kilobytes. */
export function formatBytes(bytes?: number | null): string {
  const value = Number(bytes) || 0;
  if (value <= 0) return '0 B';

  let size = value;
  let unit = 0;

  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${unit === 0 ? Math.round(size) : size.toFixed(size >= 10 ? 0 : 1)} ${UNITS[unit]}`;
}
