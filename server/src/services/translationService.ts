const SUPPORTED_LANGS = new Set(['en', 'hi', 'kn']);

const normalizeLang = (value: unknown): string => {
  const raw = String(value ?? 'en').trim().toLowerCase();
  const base = raw.split('-')[0] || 'en';
  return SUPPORTED_LANGS.has(base) ? base : 'en';
};

export async function translateText(text: string, targetLang: string): Promise<string> {
  const safeText = String(text ?? '').trim();
  const safeTarget = normalizeLang(targetLang);

  if (!safeText || safeTarget === 'en') {
    return safeText;
  }

  const endpoint = 'https://libretranslate.de/translate';

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: safeText,
        source: 'auto',
        target: safeTarget,
        format: 'text',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return safeText;
    }

    const body = await response.json();
    const translated =
      typeof body?.translatedText === 'string'
        ? body.translatedText
        : typeof body?.translation === 'string'
          ? body.translation
          : '';

    return translated && translated.trim() ? translated : safeText;
  } catch (error) {
    console.error('translateText failed:', (error as any)?.message || error);
    return safeText;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getTranslatedComplaint(doc: any, targetLang: string): Promise<string> {
  const lang = normalizeLang(targetLang);
  const originalLanguage = normalizeLang(doc?.originalLanguage || 'en');
  const originalText = String(doc?.complaintOriginal || doc?.complaint || '').trim();

  if (!originalText) {
    return '';
  }

  if (lang === originalLanguage) {
    return originalText;
  }

  const translations = doc?.translations;
  const cached =
    translations instanceof Map
      ? translations.get(lang)
      : translations && typeof translations === 'object'
        ? translations[lang]
        : undefined;

  if (typeof cached === 'string' && cached.trim()) {
    return cached;
  }

  const translated = await translateText(originalText, lang);

  if (!translated || translated === originalText) {
    return originalText;
  }

  try {
    if (!doc.translations) {
      doc.translations = new Map<string, string>();
    }

    if (doc.translations instanceof Map) {
      doc.translations.set(lang, translated);
    } else if (typeof doc.translations === 'object') {
      doc.translations[lang] = translated;
      if (typeof doc.markModified === 'function') {
        doc.markModified('translations');
      }
    }

    if (typeof doc.save === 'function') {
      await doc.save();
    }
  } catch (error) {
    // Do not fail read path if cache persistence fails.
    console.error('getTranslatedComplaint cache save failed:', (error as any)?.message || error);
  }

  return translated;
}
