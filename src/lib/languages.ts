export type Language = { code: string; name: string; native: string };

// code is a BCP-47 tag, used for speech recognition and read-aloud.
export const LANGUAGES: Language[] = [
  { code: "en-US", name: "English", native: "English" },
  { code: "id-ID", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "es-ES", name: "Spanish", native: "Español" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文" },
  { code: "vi-VN", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "tl-PH", name: "Tagalog", native: "Tagalog" },
  { code: "ko-KR", name: "Korean", native: "한국어" },
  { code: "ja-JP", name: "Japanese", native: "日本語" },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी" },
  { code: "ar-SA", name: "Arabic", native: "العربية" },
  { code: "fr-FR", name: "French", native: "Français" },
  { code: "pt-BR", name: "Portuguese", native: "Português" },
  { code: "ru-RU", name: "Russian", native: "Русский" },
  { code: "de-DE", name: "German", native: "Deutsch" },
  { code: "ms-MY", name: "Malay", native: "Bahasa Melayu" },
  { code: "th-TH", name: "Thai", native: "ไทย" },
];

export function languageByCode(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isRtl(code: string) {
  return code.startsWith("ar");
}
