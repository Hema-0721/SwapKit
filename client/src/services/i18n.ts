import { create } from 'zustand';

// Simple mock translation dictionary for English (with demonstrative Hindi keys)
const translations: Record<string, Record<string, string>> = {
  en: {
    'app.name': 'SchoolSwap',
    'landing.title': 'Swap School Supplies Within Your School Community',
    'landing.subtitle': 'Indian families spend up to ₹12,000 annually per child on supplies. Save up to 60% by swapping, bartering, and donating textbooks, uniforms, and stationery with verified parents nearby.',
    'feed.title': 'Supply Exchange',
    'feed.subtitle': 'Browse verified school supplies listed by parents in your school community.',
    'navbar.feed': 'Feed',
    'navbar.checklist': 'Checklist',
    'navbar.chats': 'Chats',
    'navbar.profile': 'Profile',
    'navbar.logout': 'Logout',
    'navbar.login': 'Login / Register',
  },
  hi: {
    'app.name': 'स्कूलस्वैप',
    'landing.title': 'अपने स्कूल समुदाय में स्कूल सामग्री की अदला-बदली करें',
    'landing.subtitle': 'भारतीय परिवार सालाना प्रति बच्चा ₹12,000 तक खर्च करते हैं। सत्यापित माता-पिता के साथ पाठ्यपुस्तकों, वर्दी और स्टेशनरी की अदला-बदली, वस्तु-विनिमय और दान करके 60% तक बचाएं।',
    'feed.title': 'सामग्री विनिमय',
    'feed.subtitle': 'अपने स्कूल समुदाय में माता-पिता द्वारा सूचीबद्ध सत्यापित स्कूल आपूर्ति ब्राउज़ करें।',
    'navbar.feed': 'फीड',
    'navbar.checklist': 'चेकलिस्ट',
    'navbar.chats': 'बातचीत',
    'navbar.profile': 'प्रोफ़ाइल',
    'navbar.logout': 'लॉगआउट',
    'navbar.login': 'लॉगिन / पंजीकरण',
  }
};

interface I18nState {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, fallback?: string) => string;
}

export const useI18n = create<I18nState>((set, get) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  t: (key, fallback) => {
    const locale = get().locale;
    return translations[locale]?.[key] || fallback || translations['en']?.[key] || key;
  }
}));
