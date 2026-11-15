import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'hi' | 'en';

export interface Translations {
  dadaJiView: string;
  caretakerView: string;
  greetingNamaste: string;
  emergencySos: string;
  todaySchedule: string;
  slotMorning: string;
  slotAfternoon: string;
  slotEvening: string;
  slotNight: string;
  markTakenBtn: string;
  doseTakenSuccess: string;
  afterMeal: string;
  beforeMeal: string;
  withMeal: string;
  anytimeMeal: string;
  listenVoiceGuidance: string;
  caretakerVoiceNote: string;
  noPillsScheduled: string;
  antiOverdoseShield: string;
  pairCodeLabel: string;
  dueNowBadge: string;
  pendingDoses: string;
  completedDoses: string;
}

const translationsMap: Record<Language, Translations> = {
  hi: {
    dadaJiView: 'दादा जी व्यू',
    caretakerView: 'केयरगिवर (देखभालकर्ता)',
    greetingNamaste: 'नमस्ते दादा जी',
    emergencySos: 'आपातकालीन SOS कॉल',
    todaySchedule: 'आज की दवाइयां (Today\'s Pills)',
    slotMorning: 'सुबह',
    slotAfternoon: 'दोपहर',
    slotEvening: 'शाम',
    slotNight: 'रात',
    markTakenBtn: 'मैंने खा ली ✅',
    doseTakenSuccess: 'दवा ले ली गई है ✅',
    afterMeal: 'खाने के बाद',
    beforeMeal: 'खाने से पहले (खाली पेट)',
    withMeal: 'खाने के साथ',
    anytimeMeal: 'किसी भी समय',
    listenVoiceGuidance: 'केयरगिवर की आवाज सुनें',
    caretakerVoiceNote: 'केयरगिवर की सलाह',
    noPillsScheduled: 'इस समय के लिए कोई दवा नहीं है।',
    antiOverdoseShield: 'सुरक्षा लॉक: आप यह दवा पहले ही ले चुके हैं।',
    pairCodeLabel: 'पेयरिंग कोड',
    dueNowBadge: 'अभी लेने का समय',
    pendingDoses: 'दवा बाकी है',
    completedDoses: 'दवाइयां ली जा चुकी हैं'
  },
  en: {
    dadaJiView: 'Dada Ji View',
    caretakerView: 'Caregiver View',
    greetingNamaste: 'Namaste, Dada Ji',
    emergencySos: 'Emergency SOS Call',
    todaySchedule: "Today's Visual Pillbox",
    slotMorning: 'Morning',
    slotAfternoon: 'Afternoon',
    slotEvening: 'Evening',
    slotNight: 'Night',
    markTakenBtn: 'Mark as Taken ✅',
    doseTakenSuccess: 'Dose Confirmed ✅',
    afterMeal: 'After Food',
    beforeMeal: 'Before Food (Empty Stomach)',
    withMeal: 'With Food',
    anytimeMeal: 'Anytime',
    listenVoiceGuidance: 'Play Caregiver Voice Guidance',
    caretakerVoiceNote: "Caregiver's Guidance",
    noPillsScheduled: 'No medicines scheduled for this time slot.',
    antiOverdoseShield: 'Safety Shield: This dose was already taken.',
    pairCodeLabel: 'Pair Code',
    dueNowBadge: 'Due Now',
    pendingDoses: 'doses pending',
    completedDoses: 'doses completed'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('hi'); // Default to Hindi for Indian elderly

  useEffect(() => {
    const saved = localStorage.getItem('aayucare_lang') as Language | null;
    if (saved && (saved === 'hi' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('aayucare_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translationsMap[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
