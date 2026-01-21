const normalizeBase = (url: string) => url.replace(/\/$/, '');

export const API_BASE =
  normalizeBase(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : ''));
