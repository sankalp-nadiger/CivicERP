import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPPORTED_TRANSLATION_LANGS = ['en', 'kn', 'hi'] as const;
const SUPPORTED_LANGS = new Set<string>(SUPPORTED_TRANSLATION_LANGS);

export type SupportedTranslationLang = (typeof SUPPORTED_TRANSLATION_LANGS)[number];
export type ComplaintTranslations = Record<SupportedTranslationLang, string>;

export const normalizeLang = (value: unknown): SupportedTranslationLang => {
  const raw = String(value ?? 'en').trim().toLowerCase();
  const base = raw.split('-')[0] || 'en';
  return SUPPORTED_LANGS.has(base) ? (base as SupportedTranslationLang) : 'en';
};

export const detectLanguageFromText = (value: unknown): SupportedTranslationLang => {
  const text = String(value ?? '').trim();
  if (!text) return 'en';

  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
};

const buildFallbackTranslations = (text: string): ComplaintTranslations => ({
  en: text,
  kn: text,
  hi: text,
});

const extractJsonObject = (raw: string): string | null => {
  const text = String(raw || '').trim();
  if (!text) return null;

  const withoutFences = text.replace(/```json|```/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  return withoutFences.slice(start, end + 1);
};

const parseGeminiTranslations = (raw: string): ComplaintTranslations | null => {
  const extracted = extractJsonObject(raw);
  if (!extracted) return null;

  const candidates = [
    extracted,
    extracted
      .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*?)'(\s*[,}])/g, ':"$1"$2'),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<Record<SupportedTranslationLang, unknown>>;
      const en = String(parsed.en ?? '').trim();
      const kn = String(parsed.kn ?? '').trim();
      const hi = String(parsed.hi ?? '').trim();
      if (en && kn && hi) {
        return { en, kn, hi };
      }
    } catch {
      // Try next parse strategy.
    }
  }

  return null;
};

export async function translateComplaintWithGemini(text: string): Promise<ComplaintTranslations> {
  const safeText = String(text ?? '').trim();
  if (!safeText) {
    return buildFallbackTranslations('');
  }

  const apiKey = String(process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('GOOGLE_API_KEY is not configured. Saving fallback complaint translations.');
    return buildFallbackTranslations(safeText);
  }

  const prompt = [
    'Translate the following complaint into English, Kannada, and Hindi.',
    'Return ONLY JSON in this exact format:',
    '{',
    '  "en": "...",',
    '  "kn": "...",',
    '  "hi": "..."',
    '}',
    '',
    `Complaint: ${safeText}`,
  ].join('\n');

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(prompt);
    const output = response.response.text();
    const parsed = parseGeminiTranslations(output);

    if (!parsed) {
      console.warn('Gemini translation response could not be parsed as JSON. Using fallback translations.');
      return buildFallbackTranslations(safeText);
    }

    return parsed;
  } catch (error) {
    console.error('translateComplaintWithGemini failed:', (error as any)?.message || error);
    return buildFallbackTranslations(safeText);
  }
}

export async function translateCategoriesWithGemini(categories: string[]): Promise<Record<SupportedTranslationLang, string[]>> {
  const safeCategories = Array.isArray(categories)
    ? categories.map(c => String(c ?? '').trim()).filter(Boolean)
    : [];

  if (safeCategories.length === 0) {
    return { en: [], kn: [], hi: [] };
  }

  const apiKey = String(process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('GOOGLE_API_KEY is not configured. Saving fallback category translations.');
    return { en: safeCategories, kn: safeCategories, hi: safeCategories };
  }

  const categoriesList = safeCategories.join('\n');
  const prompt = [
    'Translate the following complaint categories/tags into English, Kannada, and Hindi.',
    'Return ONLY JSON in this exact format (arrays of translated strings):',
    '{',
    '  "en": ["category1", "category2"],',
    '  "kn": ["category1_kn", "category2_kn"],',
    '  "hi": ["category1_hi", "category2_hi"]',
    '}',
    '',
    `Categories:\n${categoriesList}`,
  ].join('\n');

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(prompt);
    const output = response.response.text();
    const extracted = extractJsonObject(output);
    if (!extracted) {
      console.warn('Gemini category translation response could not be parsed. Using fallback.');
      return { en: safeCategories, kn: safeCategories, hi: safeCategories };
    }

    const parsed = JSON.parse(extracted) as Partial<Record<SupportedTranslationLang, unknown>>;
    const en = Array.isArray(parsed.en) ? parsed.en.map(c => String(c ?? '').trim()).filter(Boolean) : safeCategories;
    const kn = Array.isArray(parsed.kn) ? parsed.kn.map(c => String(c ?? '').trim()).filter(Boolean) : safeCategories;
    const hi = Array.isArray(parsed.hi) ? parsed.hi.map(c => String(c ?? '').trim()).filter(Boolean) : safeCategories;

    return {
      en: en.length > 0 ? en : safeCategories,
      kn: kn.length > 0 ? kn : safeCategories,
      hi: hi.length > 0 ? hi : safeCategories,
    };
  } catch (error) {
    console.error('translateCategoriesWithGemini failed:', (error as any)?.message || error);
    return { en: safeCategories, kn: safeCategories, hi: safeCategories };
  }
}

export async function generateComplaintTranslations(text: string, categories?: string[]): Promise<{
  originalLanguage: SupportedTranslationLang;
  translations: ComplaintTranslations;
  categoryTranslations: Record<SupportedTranslationLang, string[]>;
}> {
  const safeText = String(text ?? '').trim();
  const originalLanguage = detectLanguageFromText(safeText);
  const translations = await translateComplaintWithGemini(safeText);
  const categoryTranslations = await translateCategoriesWithGemini(categories || []);

  return {
    originalLanguage,
    translations,
    categoryTranslations,
  };
}

export async function getTranslatedComplaint(doc: any, targetLang: string): Promise<string> {
  const lang = normalizeLang(targetLang);
  const fallback = String(doc?.complaint || doc?.complaintOriginal || '').trim();
  const translations = doc?.translations;

  const stored =
    translations instanceof Map
      ? translations.get(lang)
      : translations && typeof translations === 'object'
        ? translations[lang]
        : undefined;

  if (typeof stored === 'string' && stored.trim()) {
    return stored;
  }

  return fallback;
}

export async function getTranslatedCategories(doc: any, targetLang: string): Promise<string[]> {
  const lang = normalizeLang(targetLang);
  const fallback = Array.isArray(doc?.issue_category) ? doc.issue_category : [];
  const categoryTranslations = doc?.categoryTranslations;

  const stored =
    categoryTranslations instanceof Map
      ? categoryTranslations.get(lang)
      : categoryTranslations && typeof categoryTranslations === 'object'
        ? categoryTranslations[lang]
        : undefined;

  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  return fallback;
}
