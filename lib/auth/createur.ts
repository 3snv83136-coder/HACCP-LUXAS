export type CreateurPayload = {
  createurId: string;
  email: string;
  prenom: string;
  nom: string;
  exp: number;
};

const encoder = new TextEncoder();

function secret() {
  return process.env.SESSION_SECRET || "le-zinc-bouillon-haccp";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i += 1) bin += String.fromCharCode(arr[i] as number);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const b64 = value.replaceAll("-", "+").replaceAll("_", "/") + pad;
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(sig);
}

export async function signCreateur(payload: Omit<CreateurPayload, "exp">, hours = 24) {
  const body: CreateurPayload = { ...payload, exp: Date.now() + hours * 3600 * 1000 };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(body)));
  const sig = await hmac(encoded);
  return `${encoded}.${sig}`;
}

export async function readCreateur(token: string | undefined | null): Promise<CreateurPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = await hmac(encoded);
  if (expected.length !== sig.length) return null;
  let same = 0;
  for (let i = 0; i < expected.length; i += 1) same |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (same !== 0) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const payload = JSON.parse(json) as CreateurPayload;
    if (!payload.exp || payload.exp < Date.now() || !payload.createurId) return null;
    return payload;
  } catch {
    return null;
  }
}

export const CREATEUR_COOKIE = "sanitrace_createur";
