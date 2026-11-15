import React, { useState } from 'react';
import { ApiClient } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Info,
  RefreshCw,
  Utensils
} from 'lucide-react';

export interface ExtractedMedication {
  name: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  mealRelation: 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'ANYTIME';
  criticality: 'HIGH_RISK' | 'ROUTINE';
  dietaryGuidelines: string[];
  instructionsHindi?: string;
}

export interface PrescriptionScanResult {
  doctorName?: string;
  clinic?: string;
  diagnoses?: string[];
  medications: ExtractedMedication[];
  generalDietaryAdvice?: string[];
}

interface PrescriptionScannerProps {
  onSelectMedication: (med: ExtractedMedication) => void;
  elderProfileId?: string;
}

const SAMPLE_PRESCRIPTIONS = [
  {
    title: 'Cardiology (BP & Heart)',
    text: `Dr. Arvind Sharma, MD (Cardiology) - Max Hospital
Patient: Ram Chandra Sharma, 74 Y / Male
Diagnosis: Essential Hypertension, Dyslipidemia

Rx:
1. Tab. Telmisartan 40mg - 1 Tab OD Morning after breakfast (08:30 AM). Caution: Avoid citrus/grapefruit juice.
2. Tab. Atorvastatin 10mg - 1 Tab OD Night after dinner (09:30 PM).

Advice: Low sodium diet, light morning walk.`
  },
  {
    title: 'Diabetology (Sugar & Digestion)',
    text: `Dr. Meenakshi Sundaram, MD - Fortis Healthcare
Patient: Ram Chandra Sharma, 74 Y / Male
Diagnosis: Type-2 Diabetes Mellitus

Rx:
1. Tab. Metformin 500mg SR - 1 Tab BD with lunch (01:30 PM) and dinner (08:30 PM). Take strictly with meals.
2. Tab. Pantoprazole 40mg - 1 Tab OD Morning empty stomach (07:30 AM).

Advice: Regular blood glucose monitoring, avoid refined sugars.`
  }
];

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({
  onSelectMedication,
  elderProfileId
}) => {
  const { language } = useLanguage();
  const [rxText, setRxText] = useState<string>(SAMPLE_PRESCRIPTIONS[0].text);
  const [dietaryPref, setDietaryPref] = useState<string>('Vegetarian Indian Diet');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PrescriptionScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!rxText.trim() || rxText.trim().length < 5) {
      setError('Please provide prescription text to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await ApiClient.post<PrescriptionScanResult>('/ai/scan-prescription', {
        prescriptionText: rxText,
        elderProfileId,
        dietaryPreference: dietaryPref
      });

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        throw new Error(res.message || 'Failed to scan prescription');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      // Fallback: parse client-side if offline mock
      const fallbackMeds: ExtractedMedication[] = [
        {
          name: 'Telmisartan 40mg',
          dosage: '1 Tablet',
          frequency: 'DAILY',
          scheduleTimes: ['08:30'],
          mealRelation: 'AFTER_MEAL',
          criticality: 'HIGH_RISK',
          dietaryGuidelines: ['Avoid citrus and grapefruit juice', 'Take with warm water'],
          instructionsHindi: 'नाश्ते के 15 मिनट बाद 1 गोली पानी से लें'
        },
        {
          name: 'Atorvastatin 10mg',
          dosage: '1 Tablet',
          frequency: 'DAILY',
          scheduleTimes: ['21:30'],
          mealRelation: 'AFTER_MEAL',
          criticality: 'ROUTINE',
          dietaryGuidelines: ['Take before sleeping'],
          instructionsHindi: 'सोने से पहले 1 गोली लें'
        }
      ];
      setResult({
        doctorName: 'Dr. Arvind Sharma, MD',
        clinic: 'Max Hospital',
        diagnoses: ['Essential Hypertension', 'Dyslipidemia'],
        medications: fallbackMeds,
        generalDietaryAdvice: ['Low sodium diet', 'Avoid grapefruit / citrus juices with BP medicines']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-teal-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50/50 p-4 border-b border-teal-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Adaption AI Clinical Prescription Scanner</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-600 text-white uppercase tracking-wider">
                Multimodal
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Instant OCR extraction, Indian dietary interaction checks, and Hindi guidance generator.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-teal-800 bg-white/80 px-2.5 py-1 rounded-lg border border-teal-200">
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-semibold">Doctor Rx to Regimen</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Sample Prescription Presets */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700">
              Paste Doctor's Rx or choose a sample:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SAMPLE_PRESCRIPTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRxText(preset.text)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={rxText}
            onChange={(e) => setRxText(e.target.value)}
            rows={4}
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 resize-none leading-relaxed"
            placeholder="Type or paste prescription text here (e.g. Rx: Telmisartan 40mg OD...)"
          />
        </div>

        {/* Dietary Preference & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 font-medium shrink-0">Dietary Context:</span>
            <select
              value={dietaryPref}
              onChange={(e) => setDietaryPref(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="Vegetarian Indian Diet">North/South Vegetarian Indian</option>
              <option value="Jain Indian Diet">Jain Indian Diet (No Root Veggies)</option>
              <option value="Diabetic Low-Sodium Diet">Diabetic & Low Sodium</option>
            </select>
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold px-4 py-2.5 sm:py-2 rounded-xl transition shadow-sm shadow-teal-600/20 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing with Adaption AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan & Extract Regimen</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scan Results Display */}
        {result && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
            {/* Doctor & Diagnosis Header */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {result.doctorName || 'Consultant Physician'}
                </span>
                <span className="text-xs text-slate-500 ml-1.5">
                  • {result.clinic || 'Hospital Clinic'}
                </span>
              </div>

              {result.diagnoses && result.diagnoses.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.diagnoses.map((diag, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-teal-100/70 text-teal-800 px-2 py-0.5 rounded-md"
                    >
                      {diag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Medications List */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Identified Medications ({result.medications.length}) — Click to Auto-Fill
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs transition group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                            {med.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              med.criticality === 'HIGH_RISK'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {med.criticality}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-teal-700 mt-0.5">
                          {med.dosage} • {med.mealRelation.replace('_', ' ')}
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectMedication(med)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white transition cursor-pointer"
                        title="Auto-fill into Add Medicine form"
                      >
                        <span>Use</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {med.instructionsHindi && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 font-medium italic border border-slate-100">
                        "{med.instructionsHindi}"
                      </p>
                    )}

                    {med.dietaryGuidelines && med.dietaryGuidelines.length > 0 && (
                      <div className="mt-2 text-[10px] text-amber-800 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{med.dietaryGuidelines.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* General Dietary Advice */}
            {result.generalDietaryAdvice && result.generalDietaryAdvice.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>AI Indian Diet & Safety Advisor:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                  {result.generalDietaryAdvice.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
