import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "select_language": "Select Language",
      "settings": "Settings",
      "home": "Home",
      "target": "Target",
      "history": "History"
    }
  },
  hi: {
    translation: {
      "select_language": "भाषा चुनें",
      "settings": "सेटिंग्स",
      "home": "होम",
      "target": "लक्ष्य",
      "history": "इतिहास"
    }
  },
  mr: {
    translation: {
      "select_language": "भाषा निवडा",
      "settings": "सेटिंग्स",
      "home": "होम",
      "target": "लक्ष्य",
      "history": "इतिहास"
    }
  },
  bn: {
    translation: {
      "select_language": "ভাষা নির্বাচন করুন",
      "settings": "সেটিংস",
      "home": "হোম",
      "target": "লক্ষ্য",
      "history": "ইতিহাস"
    }
  },
  te: {
    translation: {
      "select_language": "భాషను ఎంచుకోండి",
      "settings": "సెట్టింగ్‌లు",
      "home": "హోమ్",
      "target": "లక్ష్యం",
      "history": "చరిత్ర"
    }
  },
  ta: {
    translation: {
      "select_language": "மொழியைத் தேர்ந்தெடுக்கவும்",
      "settings": "அமைப்புகள்",
      "home": "முகப்பு",
      "target": "இலக்கு",
      "history": "வரலாறு"
    }
  },
  gu: {
    translation: {
      "select_language": "ભાષા પસંદ કરો",
      "settings": "સેટિંગ્સ",
      "home": "હોમ",
      "target": "લક્ષ્ય",
      "history": "ઇતિહાસ"
    }
  },
  kn: {
    translation: {
      "select_language": "भाषೆಯನ್ನು ಆರಿಸಿ",
      "settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      "home": "ಹೋಮ್",
      "target": "ಗುರಿ",
      "history": "ಇತಿಹಾಸ"
    }
  },
  ml: {
    translation: {
      "select_language": "ഭാഷ തിരഞ്ഞെടുക്കുക",
      "settings": "ക്രമീകരണങ്ങൾ",
      "home": "ഹോം",
      "target": "ലക്ഷ്യം",
      "history": "ചരിത്രം"
    }
  },
  pa: {
    translation: {
      "select_language": "ਭਾਸ਼ਾ ਚੁਣੋ",
      "settings": "ਸੈਟਿੰਗਾਂ",
      "home": "ਹੋਮ",
      "target": "ਟੀਚਾ",
      "history": "ਇਤਿਹਾਸ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

