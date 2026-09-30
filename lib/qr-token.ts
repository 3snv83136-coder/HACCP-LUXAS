export function extraireQrSanitrace(raw: string): string {
  const t = raw.trim();
  try {
    const url = new URL(t);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? t;
  } catch {
    return t;
  }
}

export function estQrEtiquette(token: string): boolean {
  return (
    token.startsWith("sanitrace:lot:") ||
    token.startsWith("sanitrace:etiquette:") ||
    token.startsWith("lot:")
  );
}

export function tokenLot(token: string): string {
  if (token.startsWith("sanitrace:lot:")) return token.slice("sanitrace:lot:".length);
  if (token.startsWith("lot:")) return token.slice("lot:".length);
  return token;
}

export function tokenEtiquette(token: string): string {
  if (token.startsWith("sanitrace:etiquette:")) return token.slice("sanitrace:etiquette:".length);
  return token;
}
