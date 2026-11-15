import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../services/api';
import { Medication } from '../../types';
import { PrescriptionScanner, ExtractedMedication } from './PrescriptionScanner';
import { AddMedicationModal } from './AddMedicationModal';
import {
  Pill,
  Plus,
  Sparkles,
  Trash2,
  Clock,
  Utensils,
  Volume2,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  VolumeX,
  FileText
} from 'lucide-react';

export const MedicineStudio: React.FC = () => {
  const { activeElder } = useAuth();
  const { language } = useLanguage();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAiScanner, setShowAiScanner] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAiMed, setSelectedAiMed] = useState<ExtractedMedication | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fallback demo meds if no active elder or offline
  const DEMO_MEDICATIONS: Medication[] = [
    {
      id: 'demo-med-1',
      elderProfileId: activeElder?.id || 'demo-elder',
      name: 'Telmisartan 40mg (Micardis)',
      dosage: '1 Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['08:30'],
      mealRelation: 'AFTER_MEAL',
      criticality: 'HIGH_RISK',
      pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
      voiceNoteUrl: null,
      voiceNoteText: 'दादा जी, नाश्ते के 15 मिनट बाद एक गोली गुनगुने पानी के साथ ले लीजिए। यह बीपी सामान्य रखेगी।',
      dietaryGuidelines: ['खट्टे फल और मौसमी का जूस साथ में न लें', 'Avoid grapefruit'],
      instructions: 'Take with warm water after breakfast',
      isActive: true
    },
    {
      id: 'demo-med-2',
      elderProfileId: activeElder?.id || 'demo-elder',
      name: 'Metformin 500mg (Glycomet-SR)',
      dosage: '1 Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['13:30', '20:30'],
      mealRelation: 'WITH_MEAL',
      criticality: 'ROUTINE',
      pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      voiceNoteUrl: null,
      voiceNoteText: 'दोपहर और रात के खाने के बीच में यह गोली लें। खाली पेट बिल्कुल न लें।',
      dietaryGuidelines: ['भोजन के बीच में ही लें'],
      instructions: 'Take strictly with meals',
      isActive: true
    },
    {
      id: 'demo-med-3',
      elderProfileId: activeElder?.id || 'demo-elder',
      name: 'Atorvastatin 10mg (Atorva)',
      dosage: '1 Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['21:30'],
      mealRelation: 'AFTER_MEAL',
      criticality: 'ROUTINE',
      pillImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
      voiceNoteUrl: null,
      voiceNoteText: 'सोने से पहले पानी के साथ एक गोली लें। शुभ रात्रि दादा जी!',
      dietaryGuidelines: ['हल्के गुनगुने पानी के साथ लें'],
      instructions: 'Take before sleeping',
      isActive: true
    }
  ];

  const fetchMedications = useCallback(async () => {
    if (!activeElder?.id) {
      setMedications(DEMO_MEDICATIONS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await ApiClient.get<Medication[]>(`/medications/elder/${activeElder.id}`);
      if (res.success && res.data && res.data.length > 0) {
        setMedications(res.data);
      } else {
        setMedications(DEMO_MEDICATIONS);
      }
    } catch (err) {
      console.warn('Using demo medications fallback:', err);
      setMedications(DEMO_MEDICATIONS);
    } finally {
      setLoading(false);
    }
  }, [activeElder?.id]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Handle Discontinue / Delete
  const handleDeleteMedication = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to discontinue ${name}? It will be removed from Dada Ji's daily pillbox.`)) {
      return;
    }

    try {
      if (id.startsWith('demo-')) {
        setMedications(medications.filter((m) => m.id !== id));
        setActionNotice(`${name} has been discontinued.`);
        return;
      }

      const res = await ApiClient.delete(`/medications/${id}`);
      if (res.success) {
        setActionNotice(`${name} has been discontinued.`);
        await fetchMedications();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setActionNotice(err?.message || 'Error discontinuing medication');
    }
  };

  // Play voice note or text-to-speech preview
  const handlePlayVoice = (med: Medication) => {
    if (playingId === med.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    setPlayingId(med.id);

    if (med.voiceNoteUrl) {
      const audio = new Audio(med.voiceNoteUrl);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => speakText(med.voiceNoteText || med.name);
      audio.play().catch(() => speakText(med.voiceNoteText || med.name));
    } else if (med.voiceNoteText) {
      speakText(med.voiceNoteText);
    } else {
      speakText(`दादा जी, यह ${med.name} है। समय पर ले लीजिए।`);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'hi-IN';
      utt.rate = 0.9;
      utt.onend = () => setPlayingId(null);
      utt.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utt);
    } else {
      setPlayingId(null);
    }
  };

  // Auto-fill from AI scanner into Add Modal
  const handleSelectAiMedication = (aiMed: ExtractedMedication) => {
    setSelectedAiMed(aiMed);
    setIsAddModalOpen(true);
  };

  // Filtered meds
  const filteredMeds = medications.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.dosage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* 1. Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Medication Studio & Regimen Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Setup tablet strip photos & loving voice notes once per prescription; automatically serves Dada Ji for 30 days.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setShowAiScanner(!showAiScanner)}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showAiScanner
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showAiScanner ? 'Hide AI Scanner' : 'AI Scan Prescription'}</span>
            </button>

            <button
              onClick={() => {
                setSelectedAiMed(null);
                setIsAddModalOpen(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-teal-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>

        {/* Action notification */}
        {actionNotice && (
          <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between animate-fade-in">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-teal-700 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2. Embedded AI Prescription Scanner (Collapsible) */}
        {showAiScanner && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <PrescriptionScanner
              onSelectMedication={handleSelectAiMedication}
              elderProfileId={activeElder?.id}
            />
          </div>
        )}
      </div>

      {/* 3. Search and Active Regimens List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active medicines (e.g. Telmisartan)..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 justify-between sm:justify-end">
            <span>Active Regimens:</span>
            <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
              {medications.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading medicines...</p>
          </div>
        ) : filteredMeds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <Pill className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No medications found</p>
            <p className="text-[11px] text-slate-400">
              Use "Add Medicine" or scan a doctor's prescription with Adaption AI.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredMeds.map((med) => {
              const isPlaying = playingId === med.id;

              return (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition p-4 space-y-3.5 flex flex-col justify-between"
                >
                  {/* Top: Photo & Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {med.pillImageUrl ? (
                        <img
                          src={med.pillImageUrl}
                          alt={med.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as any).src =
                              'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80';
                          }}
                        />
                      ) : (
                        <Pill className="w-6 h-6 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            med.criticality === 'HIGH_RISK'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {med.criticality}
                        </span>

                        <button
                          onClick={() => handleDeleteMedication(med.id, med.name)}
                          title="Discontinue Medication"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 truncate mt-1">
                        {med.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-teal-700">
                        {med.dosage}
                      </p>
                    </div>
                  </div>

                  {/* Timings & Meal Relation */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{med.scheduleTimes.join(', ')}</span>
                    </div>

                    <div className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md text-teal-800 font-medium">
                      <Utensils className="w-3 h-3 text-teal-600" />
                      <span>{med.mealRelation.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Voice Guidance Note Preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        Caretaker Voice Guidance
                      </span>
                      <button
                        onClick={() => handlePlayVoice(med)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                      >
                        {isPlaying ? (
                          <>
                            <VolumeX className="w-3 h-3 animate-pulse text-rose-600" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Play</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium italic line-clamp-2">
                      "{med.voiceNoteText || 'दादा जी, यह दवा समय पर पानी के साथ ले लीजिए।'}"
                    </p>
                  </div>

                  {/* Dietary cautions (if any) */}
                  {med.dietaryGuidelines && med.dietaryGuidelines.length > 0 && (
                    <div className="text-[10px] text-amber-800 bg-amber-50/70 border border-amber-200 rounded-md p-1.5 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{med.dietaryGuidelines.join(' • ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Add Medication Modal */}
      <AddMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedAiMed(null);
        }}
        onSuccess={() => {
          fetchMedications();
          setActionNotice('Medication successfully scheduled and added to Dada Ji\'s Visual Pillbox!');
        }}
        elderProfileId={activeElder?.id || 'demo-elder-id'}
        initialData={selectedAiMed}
      />
    </div>
  );
};
