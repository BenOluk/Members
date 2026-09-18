export function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string): boolean {
  return value.length >= 12 && value.length <= 128;
}

/** URLs de conteúdo nunca aceitam javascript:, data:, credenciais ou protocolos mistos. */
export function safeUrl(value: string, local = false): boolean {
  if (local && /^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}
