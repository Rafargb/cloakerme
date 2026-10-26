// Visually identical homoglyphs (Cyrillic / Greek / mathematical lookalikes)
const HOMOGLYPHS: Record<string, string[]> = {
  a: ["\u0430"], // Cyrillic small a
  c: ["\u0441"], // Cyrillic small es
  e: ["\u0435"], // Cyrillic small ie
  i: ["\u0456"], // Cyrillic small byelorussian-ukrainian i
  j: ["\u0458"], // Cyrillic small je
  o: ["\u043E"], // Cyrillic small o
  p: ["\u0440"], // Cyrillic small er
  s: ["\u0455"], // Cyrillic small dze
  x: ["\u0445"], // Cyrillic small ha
  y: ["\u0443"], // Cyrillic small u
  A: ["\u0410", "\u0391"], // Cyrillic A, Greek Alpha
  B: ["\u0412", "\u0392"], // Cyrillic Ve, Greek Beta
  C: ["\u0421"], // Cyrillic Es
  E: ["\u0415", "\u0395"], // Cyrillic Ie, Greek Epsilon
  H: ["\u041D", "\u0397"], // Cyrillic En, Greek Eta
  I: ["\u0406", "\u0399"], // Cyrillic I, Greek Iota
  J: ["\u0408"], // Cyrillic Je
  K: ["\u041A", "\u039A"], // Cyrillic Ka, Greek Kappa
  M: ["\u041C", "\u039C"], // Cyrillic Em, Greek Mu
  N: ["\u039D"], // Greek Nu
  O: ["\u041E", "\u039F"], // Cyrillic O, Greek Omicron
  P: ["\u0420", "\u03A1"], // Cyrillic Er, Greek Rho
  S: ["\u0405"], // Cyrillic Dze
  T: ["\u0422", "\u03A4"], // Cyrillic Te, Greek Tau
  X: ["\u0425", "\u03A7"], // Cyrillic Ha, Greek Chi
  Y: ["\u03A5"], // Greek Upsilon
  Z: ["\u0396"], // Greek Zeta
};

const ZERO_WIDTH_CHARS = [
  "\u200B", // Zero-width space
  "\u200C", // Zero-width non-joiner
  "\u200D", // Zero-width joiner
  "\u2060", // Word joiner
];

export function cloakText(input: string, intensity = 100): string {
  if (!input) return "";
  const ratio = Math.max(0, Math.min(100, Number(intensity) || 0)) / 100;
  if (ratio === 0) return input;

  let out = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const candidates = HOMOGLYPHS[ch];

    // Replace character with homoglyph based on intensity probability
    if (candidates && candidates.length > 0 && Math.random() <= ratio) {
      const replacement = candidates[Math.floor(Math.random() * candidates.length)];
      out += replacement;
    } else {
      out += ch;
    }

    // Inject invisible zero-width characters inside words to break keyword tokenization
    const nextCh = input[i + 1];
    if (
      nextCh &&
      /\p{L}|\p{N}/u.test(ch) &&
      /\p{L}|\p{N}/u.test(nextCh) &&
      Math.random() <= ratio * 0.65
    ) {
      const zw = ZERO_WIDTH_CHARS[Math.floor(Math.random() * ZERO_WIDTH_CHARS.length)];
      out += zw;
    }
  }

  return out;
}
