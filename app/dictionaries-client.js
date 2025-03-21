// Client-side version of dictionaries.js without server-only import
// For use in client components

// Dictionary cache to prevent repeated imports
const dictCache = new Map();

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  bn: () => import("./dictionaries/bn.json").then((module) => module.default),
  ar: () => import("./dictionaries/ar.json").then((module) => module.default),
};

export const getDictionary = async (locale) => {
  try {
    // Check if we already have this dictionary in cache
    if (dictCache.has(locale)) {
      return dictCache.get(locale);
    }
    
    // Default to English if locale is not supported
    const supportedLocale = dictionaries[locale] ? locale : 'en';
    
    // Get dictionary and store in cache
    const dictionary = await dictionaries[supportedLocale]();
    dictCache.set(locale, dictionary);
    
    return dictionary;
  } catch (error) {
    console.error(`Error loading dictionary for locale ${locale}:`, error);
    // Fallback to an empty dictionary if there's an error
    return {};
  }
}; 