import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { ExtractedMedication } from './PrescriptionScanner';
import {
  X,
  Pill,
  Upload,
  Mic,
  Square,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Utensils,
  Image as ImageIcon,
  Sparkles,
  Heart
} from 'lucide-react';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  elderProfileId: string;
  initialData?: ExtractedMedication | null;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  elderProfileId,
  initialData
}) => {
  const { language } = useLanguage();

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['08:30']);
  const [mealRelation, setMealRelation] = useState<'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL' | 'ANYTIME'>('AFTER_MEAL');
  const [criticality, setCriticality] = useState<'ROUTINE' | 'HIGH_RISK'>('ROUTINE');
  const [instructions, setInstructions] = useState('');
  const [voiceNoteText, setVoiceNoteText] = useState('');
  const [dietaryGuidelines, setDietaryGuidelines] = useState<string[]>([]);
  const [dietaryInput, setDietaryInput] = useState('');

  // Media upload states
  const [pillImageUrl, setPillImageUrl] = useState<string>('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill if initialData changes (e.g. from AI scan)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDosage(initialData.dosage || '1 Tablet');
      setScheduleTimes(initialData.scheduleTimes && initialData.scheduleTimes.length > 0 ? initialData.scheduleTimes : ['08:30']);
      setMealRelation(initialData.mealRelation || 'AFTER_MEAL');
      setCriticality(initialData.criticality || 'ROUTINE');
      setDietaryGuidelines(initialData.dietaryGuidelines || []);
      if (initialData.instructionsHindi) {
        setVoiceNoteText(`दादा जी, ${initialData.instructionsHindi}।`);
      }
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Toggle timing chips
  const toggleTime = (timeStr: string) => {
    if (scheduleTimes.includes(timeStr)) {
      if (scheduleTimes.length > 1) {
        setScheduleTimes(scheduleTimes.filter((t) => t !== timeStr));
      }
    } else {
      setScheduleTimes([...scheduleTimes, timeStr].sort());
    }
  };

  // Image File Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const res = await ApiClient.uploadFile<{ url: string }>('/upload/image', file);
      if (res.data?.url) {
        setPillImageUrl(res.data.url);
      } else {
        // Fallback local object URL
        setPillImageUrl(URL.createObjectURL(file));
      }
    } catch (err: any) {
      console.warn('Upload image fallback:', err);
      // Use local object preview
      setPillImageUrl(URL.createObjectURL(file));
    } finally {
      setUploadingImage(false);
    }
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const audioFile = new File([audioBlob], 'voicenote.webm', { type: 'audio/webm' });

        setUploadingVoice(true);
        try {
          const res = await ApiClient.uploadFile<{ url: string }>('/upload/voice', audioFile);
          if (res.data?.url) {
            setVoiceNoteUrl(res.data.url);
          } else {
            setVoiceNoteUrl(URL.createObjectURL(audioBlob));
          }
        } catch {
          setVoiceNoteUrl(URL.createObjectURL(audioBlob));
        } finally {
          setUploadingVoice(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access denied or unsupported:', err);
      setError('Microphone access denied. You can still type the voice note guidance text below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Add dietary chip
  const handleAddDietary = () => {
    if (dietaryInput.trim() && !dietaryGuidelines.includes(dietaryInput.trim())) {
      setDietaryGuidelines([...dietaryGuidelines, dietaryInput.trim()]);
      setDietaryInput('');
    }
  };

  const removeDietary = (item: string) => {
    setDietaryGuidelines(dietaryGuidelines.filter((d) => d !== item));
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a medication name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await ApiClient.post('/medications', {
        elderProfileId,
        name: name.trim(),
        dosage: dosage.trim() || '1 Tablet',
        frequency: 'DAILY',
        scheduleTimes,
        mealRelation,
        criticality,
        pillImageUrl: pillImageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        voiceNoteUrl: voiceNoteUrl || null,
        voiceNoteText: voiceNoteText.trim() || 'दादा जी, यह दवा समय पर पानी के साथ ले लीजिए।',
        dietaryGuidelines,
        instructions: instructions.trim() || null
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(res.message || 'Failed to save medication');
      }
    } catch (err: any) {
      console.error('Save medication error:', err);
      setError(err?.message || 'Error saving medication');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Add Medication to Visual Pillbox
              </h2>
              <p className="text-xs text-slate-500">
                Setup tablet photo & voice guidance once; automated for 30-day schedule.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Name & Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Medication Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Telmisartan 40mg or Metformin 500mg"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 Tablet"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>
          </div>

          {/* Row 2: Timings & Meal Relation */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Daily Schedule Timings *</span>
              <span className="text-[11px] text-teal-700 font-normal">Select all that apply</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Morning (08:30)', time: '08:30' },
                { label: 'Afternoon (13:30)', time: '13:30' },
                { label: 'Evening (18:30)', time: '18:30' },
                { label: 'Night (21:30)', time: '21:30' }
              ].map((slot) => {
                const active = scheduleTimes.includes(slot.time);
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => toggleTime(slot.time)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Meal Relation & Criticality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Meal Relation</label>
              <select
                value={mealRelation}
                onChange={(e) => setMealRelation(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
              >
                <option value="AFTER_MEAL">खाने के बाद (After Food)</option>
                <option value="BEFORE_MEAL">खाने से पहले / खाली पेट (Before Food)</option>
                <option value="WITH_MEAL">खाने के साथ (With Food)</option>
                <option value="ANYTIME">किसी भी समय (Anytime)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
              >
                <option value="ROUTINE">Routine (दैनिक नियमित)</option>
                <option value="HIGH_RISK">High Risk / Critical (अत्यंत आवश्यक, BP/Heart/Sugar)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Tablet Strip Photo Upload */}
          <div className="space-y-2 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Tablet Strip Photo (दवा के पत्ते की फोटो)</span>
              </label>
              <span className="text-[11px] text-slate-500">Helps elder identify instantly</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Preview Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                {pillImageUrl ? (
                  <img src={pillImageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Pill className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition">
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  <span>{uploadingImage ? 'Uploading photo...' : 'Upload Strip Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  Take a quick phone camera snap of the medicine foil or packaging.
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Caretaker Voice Guidance */}
          <div className="space-y-2 p-3.5 sm:p-4 rounded-xl bg-teal-50/50 border border-teal-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Caretaker Voice Guidance (आपकी आवाज में सलाह)</span>
              </label>
              <span className="text-[11px] text-teal-700 font-semibold">Plays when pill is due</span>
            </div>

            <div className="space-y-2">
              <textarea
                value={voiceNoteText}
                onChange={(e) => setVoiceNoteText(e.target.value)}
                rows={2}
                placeholder="e.g. दादा जी, नाश्ते के 15 मिनट बाद 1 गोली गुनगुने पानी के साथ ले लीजिए।"
                className="w-full text-xs p-2.5 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 resize-none font-medium"
              />

              {/* Microphone Recorder & Audio Preview */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Recording</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center gap-1.5 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
                    >
                      <Mic className="w-3.5 h-3.5 text-teal-600" />
                      <span>Record Voice Note</span>
                    </button>
                  )}

                  {voiceNoteUrl && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Audio attached</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  {uploadingVoice ? 'Uploading audio...' : 'Records in browser'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 6: Dietary Guidelines & Safety Cautions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Dietary Guidelines & Cautions (सावधानियां)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDietary();
                  }
                }}
                placeholder="e.g. खट्टे फल/मौसमी का रस न लें (Press Enter to add)"
                className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
              <button
                type="button"
                onClick={handleAddDietary}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Add
              </button>
            </div>

            {dietaryGuidelines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {dietaryGuidelines.map((guideline, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md"
                  >
                    <span>{guideline}</span>
                    <button
                      type="button"
                      onClick={() => removeDietary(guideline)}
                      className="text-amber-600 hover:text-amber-900 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-teal-600/20 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Pillbox...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Schedule Pill</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
