
export enum Role {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  isHelpful?: boolean | null;
}

export interface UserProfile {
  name: string;
  age: number;
  location: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto Detect', nativeLabel: 'Auto' },
  { code: 'bn-IN', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'en-IN', label: 'English', nativeLabel: 'English' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gu-IN', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'pa-IN', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'or-IN', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
];

