import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../services/api';
import { sound } from '../../utils/sound';
import {
  TodayPillboxResponse,
  PillboxSlotItem,
  TimeSlot
} from '../../types';
import {
  Pill,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Utensils,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Heart
} from 'lucide-react';

export const VisualPillbox: React.FC = () => {
  const { elderProfile, user } = useAuth();
  const { language, t } = useLanguage();

  const [activeSlot, setActiveSlot] = useState<TimeSlot>('MORNING');
  const [pillboxData, setPillboxData] = useState<TodayPillboxResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [overdoseWarning, setOverdoseWarning] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Elder ID to query: either elderProfile.id or fallback demo
  const targetElderId = elderProfile?.id;

  const DEFAULT_DEMO_PILLBOX: TodayPillboxResponse = {
    elderProfileId: 'demo-elder-id',
    date: new Date().toISOString(),
    summary: {
      totalDoses: 3,
      takenDoses: 1,
      pendingDoses: 2
    },
    slots: {
      morning: [
        {
          id: 'demo-med-1',
          name: 'Telmisartan 40mg (Micardis)',
          dosage: '1 Tablet',
          mealRelation: 'AFTER_MEAL',
          criticality: 'HIGH_RISK',
          pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
          voiceNoteUrl: null,
          voiceNoteText: 'दादा जी, नाश्ते के 15 मिनट बाद एक गोली गुनगुने पानी के साथ ले लीजिए। यह बीपी सामान्य रखेगी।',
          dietaryGuidelines: ['खट्टे फल और मौसमी का जूस साथ में न लें'],
          instructions: 'Take with warm water after breakfast',
          scheduledTime: '08:30 AM',
          timeSlot: 'MORNING',
          status: 'TAKEN',
          takenAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isDueNow: false
        }
      ],
      afternoon: [
        {
          id: 'demo-med-2',
          name: 'Metformin 500mg (Glycomet-SR)',
          dosage: '1 Tablet',
          mealRelation: 'WITH_MEAL',
          criticality: 'ROUTINE',
          pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
          voiceNoteUrl: null,
          voiceNoteText: 'दोपहर के खाने के साथ ही यह गोली लें। खाली पेट बिल्कुल न लें।',
          dietaryGuidelines: ['भोजन के बीच में ही लें'],
          instructions: 'Take with lunch',
          scheduledTime: '01:30 PM',
          timeSlot: 'AFTERNOON',
          status: 'SCHEDULED',
          takenAt: null,
          isDueNow: true
        }
      ],
      evening: [],
      night: [
        {
          id: 'demo-med-3',
          name: 'Atorvastatin 10mg (Atorva)',
          dosage: '1 Tablet',
          mealRelation: 'AFTER_MEAL',
          criticality: 'ROUTINE',
          pillImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
          voiceNoteUrl: null,
          voiceNoteText: 'सोने से पहले पानी के साथ एक गोली लें। शुभ रात्रि दादा जी!',
          dietaryGuidelines: ['हल्के गुनगुने पानी के साथ लें'],
          instructions: 'Take before sleep',
          scheduledTime: '09:30 PM',
          timeSlot: 'NIGHT',
          status: 'SCHEDULED',
          takenAt: null,
          isDueNow: false
        }
      ]
    }
  };

  // Determine current time-of-day default slot
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      setActiveSlot('MORNING');
    } else if (currentHour >= 12 && currentHour < 17) {
      setActiveSlot('AFTERNOON');
    } else if (currentHour >= 17 && currentHour < 21) {
      setActiveSlot('EVENING');
    } else {
      setActiveSlot('NIGHT');
    }
  }, []);

  const fetchPillbox = useCallback(async () => {
    if (!targetElderId) {
      setPillboxData(DEFAULT_DEMO_PILLBOX);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await ApiClient.get<TodayPillboxResponse>(`/medications/today/${targetElderId}`);
      if (res.success && res.data) {
        setPillboxData(res.data);
      } else {
        setPillboxData(DEFAULT_DEMO_PILLBOX);
      }
    } catch (err) {
      console.warn('Using seeded pillbox fallback:', err);
      setPillboxData(DEFAULT_DEMO_PILLBOX);
    } finally {
      setLoading(false);
    }
  }, [targetElderId]);

  useEffect(() => {
    fetchPillbox();
  }, [fetchPillbox]);

  // "मैंने खा ली" (Mark as Taken) Dose Confirmation
  const handleConfirmDose = async (item: PillboxSlotItem) => {
    if (item.status === 'TAKEN' || confirmingId === item.id) return;

    setOverdoseWarning(null);
    setSuccessNotice(null);
    setConfirmingId(item.id);

    try {
      if (!targetElderId || item.id.startsWith('demo-')) {
        sound.playSuccessChime();
        const msg = language === 'hi'
          ? `शाबाश! आपने ${item.name} ले ली है। समय पर दवा लेना सेहत के लिए बहुत अच्छा है।`
          : `Great! You have taken ${item.name}. Marked on-time.`;
        setSuccessNotice(msg);

        setPillboxData((prev) => {
          if (!prev) return prev;
          const slotKey = item.timeSlot.toLowerCase() as keyof typeof prev.slots;
          return {
            ...prev,
            summary: {
              ...prev.summary,
              takenDoses: prev.summary.takenDoses + 1,
              pendingDoses: Math.max(0, prev.summary.pendingDoses - 1)
            },
            slots: {
              ...prev.slots,
              [slotKey]: prev.slots[slotKey].map((it) =>
                it.id === item.id ? { ...it, status: 'TAKEN', takenAt: new Date().toISOString() } : it
              )
            }
          };
        });
        setConfirmingId(null);
        return;
      }

      const res = await ApiClient.post<any>('/medications/confirm-dose', {
        medicationId: item.id,
        method: 'BUTTON_TAP',
        notes: 'Confirmed via Elder Visual Pillbox button tap'
      });

      if (res.success) {
        // 1. Play harmonic success chime (C5-E5-G5)
        sound.playSuccessChime();

        // 2. Set success notice
        const msg = language === 'hi'
          ? `शाबाश! आपने ${item.name} ले ली है। समय पर दवा लेना सेहत के लिए बहुत अच्छा है।`
          : `Great! You have taken ${item.name}. Marked on-time.`;
        setSuccessNotice(msg);

        // 3. Refresh today's pillbox
        await fetchPillbox();
      }
    } catch (err: any) {
      console.error('Confirm dose error:', err);
      // Catch 6-hour anti-overdose lockout shield message from backend
      const errMsg = err?.message || 'Error confirming dose';
      if (errMsg.toLowerCase().includes('already taken') || errMsg.toLowerCase().includes('lockout') || errMsg.toLowerCase().includes('6 hour') || errMsg.toLowerCase().includes('घंटे')) {
        sound.playWarningChime();
        setOverdoseWarning(
          language === 'hi'
            ? 'सुरक्षा लॉक: दादा जी, आप यह गोली पहले ही ले चुके हैं। डॉक्टर के निर्देशानुसार 6 घंटे के भीतर दोबारा न लें।'
            : 'Anti-Overdose Safety Shield: You have already taken this medication within 6 hours. Safe to rest.'
        );
      } else {
        setOverdoseWarning(errMsg);
      }
    } finally {
      setConfirmingId(null);
    }
  };

  // Play Caretaker Audio Note or Web Speech API fallback
  const handlePlayVoice = (item: PillboxSlotItem) => {
    if (playingAudioId === item.id) {
      // Stop
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(item.id);

    // If real audio URL exists, play it
    if (item.voiceNoteUrl) {
      const audio = new Audio(item.voiceNoteUrl);
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => {
        // Fallback to text-to-speech if audio fails
        speakText(item.voiceNoteText || `${item.name}, ${item.dosage}`);
      };
      audio.play().catch(() => {
        speakText(item.voiceNoteText || `${item.name}, ${item.dosage}`);
      });
    } else if (item.voiceNoteText) {
      speakText(item.voiceNoteText);
    } else {
      const text = language === 'hi'
        ? `दादा जी, यह ${item.name} है। एक गोली ${item.mealRelation === 'AFTER_MEAL' ? 'खाने के बाद' : 'पानी के साथ'} ले लीजिए।`
        : `Dada Ji, this is ${item.name}. Please take one tablet ${item.mealRelation === 'AFTER_MEAL' ? 'after food' : 'with water'}.`;
      speakText(text);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9; // gentle slow pace for elderly comprehension
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  // Get items for current selected slot
  const currentSlotItems: PillboxSlotItem[] = pillboxData
    ? pillboxData.slots[activeSlot.toLowerCase() as keyof typeof pillboxData.slots] || []
    : [];

  const getMealRelationBadge = (relation: string) => {
    switch (relation) {
      case 'BEFORE_MEAL':
        return { text: t.beforeMeal, color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'AFTER_MEAL':
        return { text: t.afterMeal, color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'WITH_MEAL':
        return { text: t.withMeal, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      default:
        return { text: t.anytimeMeal, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const slotTabs: Array<{ id: TimeSlot; labelHi: string; labelEn: string; icon: any; timeHint: string }> = [
    { id: 'MORNING', labelHi: 'सुबह', labelEn: 'Morning', icon: Sunrise, timeHint: '06:00 - 12:00' },
    { id: 'AFTERNOON', labelHi: 'दोपहर', labelEn: 'Afternoon', icon: Sun, timeHint: '12:00 - 17:00' },
    { id: 'EVENING', labelHi: 'शाम', labelEn: 'Evening', icon: Sunset, timeHint: '17:00 - 21:00' },
    { id: 'NIGHT', labelHi: 'रात', labelEn: 'Night', icon: Moon, timeHint: '21:00 - 05:00' }
  ];

  return (
    <div className="space-y-5">
      {/* 1. Header & Adherence Counter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t.todaySchedule}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'दवाइयों की पहचान उनके असली पत्ते (स्ट्रिप) की फोटो और अपनी भाषा में सुनकर करें।'
                : 'Identify medicines with tablet strip photo and voice guidance from your loved ones.'}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {pillboxData?.summary && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  {pillboxData.summary.takenDoses} / {pillboxData.summary.totalDoses}{' '}
                  {language === 'hi' ? 'खुराक ली गई' : 'doses taken'}
                </span>
              </div>
            )}

            <button
              onClick={fetchPillbox}
              title="Refresh Schedule"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Success or Anti-Overdose Notice Bar */}
        {successNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">{language === 'hi' ? 'दवा सफलतापूर्वक दर्ज हुई!' : 'Dose Confirmed!'}</p>
              <p className="text-emerald-700 mt-0.5">{successNotice}</p>
            </div>
          </div>
        )}

        {overdoseWarning && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 animate-fade-in">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">{language === 'hi' ? 'एंटी-ओवरडोज सुरक्षा लॉक' : 'Anti-Overdose Safety Shield'}</p>
              <p className="text-amber-800 mt-0.5">{overdoseWarning}</p>
            </div>
          </div>
        )}

        {/* 3. Slot Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100">
          {slotTabs.map((slot) => {
            const Icon = slot.icon;
            const isSelected = activeSlot === slot.id;
            const count = pillboxData?.slots[slot.id.toLowerCase() as keyof typeof pillboxData.slots]?.length || 0;

            return (
              <button
                key={slot.id}
                onClick={() => setActiveSlot(slot.id)}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="text-xs sm:text-sm font-bold">
                    {language === 'hi' ? slot.labelHi : slot.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[10px] sm:text-[11px]">
                  <span className={isSelected ? 'text-teal-700 font-medium' : 'text-slate-400'}>
                    {slot.timeHint}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Pills List for Active Slot */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            {language === 'hi' ? 'दवाइयों की जानकारी लोड हो रही है...' : 'Loading Visual Pillbox schedule...'}
          </p>
        </div>
      ) : currentSlotItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">
              {t.noPillsScheduled}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'hi'
                ? 'इस समय के लिए कोई दवा निर्धारित नहीं है। आप आराम से विश्राम कर सकते हैं।'
                : 'No pills scheduled for this slot. Safe to relax.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSlotItems.map((item) => {
            const isTaken = item.status === 'TAKEN';
            const mealBadge = getMealRelationBadge(item.mealRelation);
            const isAudioPlaying = playingAudioId === item.id;

            return (
              <div
                key={item.id}
                className={`med-card relative overflow-hidden transition-all ${
                  isTaken
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : item.criticality === 'HIGH_RISK'
                    ? 'border-rose-200 bg-white'
                    : 'border-slate-200/80 bg-white'
                }`}
              >
                {/* Status Bar Indicator */}
                <div className={`h-1.5 w-full ${isTaken ? 'bg-emerald-500' : 'bg-teal-500'}`} />

                <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                  {/* Top Row: Pill Strip Photo & Name */}
                  <div className="flex gap-3 sm:gap-4 items-start">
                    {/* Tablet Strip Photo uploaded by Caregiver */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      {item.pillImageUrl ? (
                        <img
                          src={item.pillImageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails
                            (e.currentTarget as any).src =
                              'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-teal-50 text-teal-600 flex flex-col items-center justify-center text-center p-1">
                          <Pill className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" />
                          <span className="text-[9px] font-bold uppercase text-teal-700">Strip</span>
                        </div>
                      )}

                      {/* Taken Overlay Badge */}
                      {isTaken && (
                        <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center text-white backdrop-blur-[1px]">
                          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded border ${
                            item.criticality === 'HIGH_RISK'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.criticality === 'HIGH_RISK' ? 'Critical' : 'Routine'}
                        </span>

                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.scheduledTime}</span>
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-1">
                        {item.name}
                      </h3>

                      <p className="text-xs font-semibold text-teal-700 mt-0.5">
                        {item.dosage}
                      </p>

                      <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md border ${mealBadge.color}`}>
                          <Utensils className="w-3 h-3" />
                          <span>{mealBadge.text}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loving Caretaker Voice Guidance Box */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                        <span className="text-xs font-bold truncate">
                          {t.caretakerVoiceNote}
                        </span>
                      </div>

                      {/* Listen Button */}
                      <button
                        onClick={() => handlePlayVoice(item)}
                        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg border transition ${
                          isAudioPlaying
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {isAudioPlaying ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 animate-pulse text-white" />
                            <span>{language === 'hi' ? 'रोकें' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'आवाज सुनें' : 'Listen'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                      "{item.voiceNoteText || (language === 'hi' ? 'दादा जी, नाश्ते के बाद एक गोली गुनगुने पानी के साथ ले लीजिए।' : 'Dada ji, please take 1 tablet with warm water after food.')}"
                    </p>
                  </div>

                  {/* Dietary Guidelines (if any) */}
                  {item.dietaryGuidelines && item.dietaryGuidelines.length > 0 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{item.dietaryGuidelines.join(' • ')}</span>
                    </div>
                  )}

                  {/* 5. Giant "मैंने खा ली ✅" Action Button */}
                  <div>
                    {isTaken ? (
                      <div className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {t.doseTakenSuccess} {item.takenAt ? `(${new Date(item.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConfirmDose(item)}
                        disabled={confirmingId === item.id}
                        className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-teal-600/30 transition-all cursor-pointer"
                      >
                        {confirmingId === item.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{language === 'hi' ? 'दर्ज हो रहा है...' : 'Recording...'}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t.markTakenBtn}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
