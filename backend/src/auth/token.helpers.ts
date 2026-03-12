export function extractBearerToken(header?: string): string | null {
  const value = String(header ?? '').trim();
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}
