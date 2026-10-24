// Instant, offline danger-sign check. Runs before (and regardless of) Claude, so
// an emergency is never delayed by the network. Claude's check runs as a second
// layer for languages and phrasings these patterns miss.
const PATTERNS: RegExp[] = [
  // English
  /\b(one|left|right) side\b.*\b(weak|numb|can'?t move)/i,
  /\b(weak|numb)\w*\b.*\b(one|left|right) side/i,
  /\bslurr\w*|\bcan'?t (speak|talk)|\bspeech\b.*\b(strange|garbled|confused)/i,
  /\b(face|mouth)\b.*\b(droop|drooping|crooked|fallen)/i,
  /\bdroop\w*\b.*\bface/i,
  /\bchest (pain|pressure|tightness)/i,
  /\b(faint|fainted|fainting|passed out|lost consciousness|unconscious|collapsed)\b/i,
  /\b(can'?t|cannot|hard to|trouble|struggling to) breath/i,
  /\bworst headache\b|\bseizure\b|\bconvuls/i,
  // Indonesian
  /\b(lemah|lumpuh|kebas|mati rasa)\b.*\bsebelah\b|\bsebelah\b.*\b(lemah|lumpuh|kebas)/i,
  /\bbicara\b.*\b(pelo|cadel|tidak jelas)\b|\bpelo\b/i,
  /\b(wajah|mulut)\b.*\b(mencong|miring|turun)\b|\bmencong\b/i,
  /\bnyeri dada\b|\bdada\b.*\b(sakit|sesak|tertekan)\b/i,
  /\bpingsan\b|\btidak sadar(kan diri)?\b|\bhilang kesadaran\b/i,
  /\bsesak napas\b.*\b(berat|parah|sekali)\b|\bsulit bernapas\b|\btidak bisa bernapas\b/i,
  /\bkejang\b/i,
  // Spanish
  /\b(debilidad|adormecimiento|entumecimiento)\b.*\bun lado\b/i,
  /\b(habla|hablar)\b.*\b(arrastrada|rara|no puede)\b/i,
  /\b(cara|boca)\b.*\b(caída|torcida)\b/i,
  /\bdolor (de|en el) pecho\b/i,
  /\b(desmay\w*|perdió el conocimiento|inconsciente)\b/i,
  /\b(no puede|dificultad para) respirar\b/i,
  /\bconvulsi\w*\b/i,
];

export function localDangerCheck(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
