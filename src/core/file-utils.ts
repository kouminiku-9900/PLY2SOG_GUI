export const MAX_FILE_SIZE_BYTES = 512 * 1024 * 1024;

export function buildOutputName(fileName: string): string {
  const sanitized = fileName.trim() || 'converted';
  const dotIndex = sanitized.lastIndexOf('.');
  const basename = dotIndex > 0 ? sanitized.slice(0, dotIndex) : sanitized;

  return `${basename}.sog`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 100 || unitIndex === 0 ? 0 : 1;

  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
}
