/** Code 39 (standard), patterns start/stop `*`. */
const PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "*": "nwnnwnwnn",
};

export function codeBarresNormalise(raw: string) {
  const clean = raw
    .toUpperCase()
    .replace(/[^0-9A-Z.\- ]/g, "")
    .slice(0, 16);
  return clean || "SANITRACE";
}

/** Code 39 : 9 modules alternés barre/espace, puis un espace étroit entre caractères. */
export function modulesCode39(raw: string) {
  const payload = `*${codeBarresNormalise(raw)}*`;
  const modules: { bar: boolean; large: boolean }[] = [];
  for (const ch of payload) {
    const pattern = PATTERNS[ch] ?? PATTERNS["0"];
    for (let i = 0; i < pattern.length; i += 1) {
      modules.push({ bar: i % 2 === 0, large: pattern[i] === "w" });
    }
    modules.push({ bar: false, large: false });
  }
  return modules;
}
