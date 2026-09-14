/**
 * 23 Official Indian Scheduled Languages (Eighth Schedule + English)
 * Supported by Sarvam AI Mayura v1 Translation Engine & BIS Assistant.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'od-IN', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as-IN', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو' },
  { code: 'sa-IN', label: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'ne-IN', label: 'Nepali', native: 'नेपाली' },
  { code: 'kok-IN', label: 'Konkani', native: 'कोंकणी' },
  { code: 'ks-IN', label: 'Kashmiri', native: 'कॉशुर / كٲشُر' },
  { code: 'mai-IN', label: 'Maithili', native: 'मैथिली' },
  { code: 'sd-IN', label: 'Sindhi', native: 'سنڌي / सिंधी' },
  { code: 'doi-IN', label: 'Dogri', native: 'डोगरी' },
  { code: 'mni-IN', label: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'brx-IN', label: 'Bodo', native: 'बड़ो' },
  { code: 'sat-IN', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
];

/**
 * Normalizes any language code or prefix to match a SUPPORTED_LANGUAGES entry.
 */
export function findLanguage(code) {
  if (!code) return SUPPORTED_LANGUAGES[0];
  const exact = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
  if (exact) return exact;
  const prefix = code.split('-')[0].toLowerCase();
  const byPrefix = SUPPORTED_LANGUAGES.find((l) => l.code.split('-')[0].toLowerCase() === prefix);
  return byPrefix || SUPPORTED_LANGUAGES[0];
}
