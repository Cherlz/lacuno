// Emergency numbers by country (ambulance / general emergency), so the
// "Call" button dials the right number where the family lives.

export type Country = { code: string; name: string; number: string; note?: string; language?: string };

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", number: "911", language: "en-US" },
  { code: "ID", name: "Indonesia", number: "112", note: "or 119 for an ambulance", language: "id-ID" },
  { code: "AU", name: "Australia", number: "000", language: "en-US" },
  { code: "BR", name: "Brazil", number: "192", note: "ambulance (SAMU)", language: "pt-BR" },
  { code: "CA", name: "Canada", number: "911", language: "en-US" },
  { code: "CN", name: "China", number: "120", note: "ambulance", language: "zh-CN" },
  { code: "EG", name: "Egypt", number: "123", note: "ambulance", language: "ar-SA" },
  { code: "FR", name: "France", number: "112", note: "or 15 for an ambulance", language: "fr-FR" },
  { code: "DE", name: "Germany", number: "112", language: "de-DE" },
  { code: "HK", name: "Hong Kong", number: "999", language: "zh-TW" },
  { code: "IN", name: "India", number: "112", note: "or 108 for an ambulance", language: "hi-IN" },
  { code: "IE", name: "Ireland", number: "112", note: "or 999", language: "en-US" },
  { code: "IT", name: "Italy", number: "112" },
  { code: "JP", name: "Japan", number: "119", note: "ambulance", language: "ja-JP" },
  { code: "MY", name: "Malaysia", number: "999", language: "ms-MY" },
  { code: "MX", name: "Mexico", number: "911", language: "es-ES" },
  { code: "NL", name: "Netherlands", number: "112" },
  { code: "NZ", name: "New Zealand", number: "111", language: "en-US" },
  { code: "PH", name: "Philippines", number: "911", language: "tl-PH" },
  { code: "PT", name: "Portugal", number: "112", language: "pt-BR" },
  { code: "RU", name: "Russia", number: "112", note: "or 103 for an ambulance", language: "ru-RU" },
  { code: "SA", name: "Saudi Arabia", number: "997", note: "ambulance", language: "ar-SA" },
  { code: "SG", name: "Singapore", number: "995", note: "ambulance", language: "en-US" },
  { code: "ZA", name: "South Africa", number: "10177", note: "ambulance; 112 from a mobile", language: "en-US" },
  { code: "KR", name: "South Korea", number: "119", note: "ambulance", language: "ko-KR" },
  { code: "ES", name: "Spain", number: "112", language: "es-ES" },
  { code: "TW", name: "Taiwan", number: "119", note: "ambulance", language: "zh-TW" },
  { code: "TH", name: "Thailand", number: "1669", note: "ambulance", language: "th-TH" },
  { code: "AE", name: "United Arab Emirates", number: "998", note: "ambulance", language: "ar-SA" },
  { code: "GB", name: "United Kingdom", number: "999", note: "or 112", language: "en-US" },
  { code: "VN", name: "Vietnam", number: "115", note: "ambulance", language: "vi-VN" },
  { code: "OTHER", name: "Another country", number: "112", note: "works from mobile phones in many countries; check your local number" },
];

export function countryByCode(code: string | undefined) {
  return COUNTRIES.find((c) => c.code === code);
}

/** Best guess from the browser's language setting (e.g. "id-ID" → Indonesia). */
export function guessCountry(): string {
  if (typeof navigator === "undefined") return "US";
  for (const lang of navigator.languages ?? [navigator.language]) {
    const region = lang.split("-")[1]?.toUpperCase();
    if (region && countryByCode(region)) return region;
  }
  return "US";
}
