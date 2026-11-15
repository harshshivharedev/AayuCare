import React, { useState, useEffect } from 'react';
import { PillboxItem, ElderProfile } from '../types';
import { ApiClient } from '../services/api';
import {
  Volume2,
  Mic,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  PhoneCall,
  Lock,
} from 'lucide-react';

interface ElderAmbientModeProps {
  elder: ElderProfile;
  pillbox: PillboxItem[];
  onRefresh: () => void;
}

export const ElderAmbientMode: React.FC<ElderAmbientModeProps> = ({ elder, pillbox, onRefresh }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Update real-time clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Speech API: Text-to-Speech Hindi Audio Guidance
  const speakGuidance = (textHindi: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(textHindi);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Calm, geriatric-friendly pace
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API: Voice Recognition Listener ("Maine kha li")
  const startVoiceConfirmation = (medId: string, medName: string) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use the Giant Green Button.');
      return;
    }

    setListening(true);
    setActionError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event: any) => {
      setListening(false);
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice recognized:', transcript);

      // Recognize confirmation phrases in Hindi or English
      if (
        transcript.includes('kha li') ||
        transcript.includes('khali') ||
        transcript.includes('le li') ||
        transcript.includes('taken') ||
        transcript.includes('yes') ||
        transcript.includes('haan')
      ) {
        await handleConfirmDose(medId, 'VOICE', transcript);
      } else {
        setActionError(`आवाज़ समझ आई: "${transcript}". कृपया कहें "मैंने खा ली" या बड़ा हरा बटन दबाएं।`);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setActionError('आवाज़ साफ़ नहीं सुनाई दी। कृपया बड़ा हरा बटन दबाएं।');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const handleConfirmDose = async (medicationId: string, method: 'BUTTON_TAP' | 'VOICE', voiceTranscript?: string) => {
    setConfirmingId(medicationId);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await ApiClient.post<any>('/medications/confirm', {
        medicationId,
        confirmationMethod: method,
        voiceTranscript,
      });

      setActionSuccess(res.message || 'दवा सफलतापूर्वक दर्ज कर ली गई! (Dose Recorded)');
      speakGuidance('शाबाश रमेश जी, आपकी दवा दर्ज हो गई है। सुरक्षा कवच सक्रिय है।');
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error confirming dose';
      setActionError(msg);
      speakGuidance('ध्यान दें! यह दवा हाल ही में ली जा चुकी है। ओवरडोज़ से बचने के लिए अभी दोबारा न लें।');
    } finally {
      setConfirmingId(null);
    }
  };

  // Find active or upcoming medication
  const activePill = pillbox[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Ambient Senior Clock & Welcome */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-sm tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>नमस्ते रमेश जी (Namaste Ramesh Ji)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            आयु-Care <span className="text-emerald-400 font-normal">कियोस्क मोड</span>
          </h1>
          <p className="text-slate-300 text-lg font-medium">
            {currentDate} • आपातकालीन नंबर: <span className="text-emerald-300 font-bold">{elder.emergencyContact}</span>
          </p>
        </div>

        {/* Giant Digital Clock */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl px-8 py-5 text-center shadow-inner">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>वर्तमान समय (Current Time)</span>
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
            {currentTime || '09:00:00 AM'}
          </div>
        </div>
      </div>

      {/* Notifications / Alerts banner */}
      {actionSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-900/60 border-2 border-emerald-400 text-emerald-100 flex items-center gap-4 text-xl font-bold shadow-xl animate-bounce">
          <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-5 rounded-2xl bg-amber-900/70 border-2 border-amber-400 text-amber-100 flex items-center gap-4 text-xl font-bold shadow-xl">
          <AlertTriangle className="w-8 h-8 text-amber-300 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Active Ambient Pill Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {pillbox.map((item) => {
          const med = item.medication;
          const isHighRisk = med.criticality === 'HIGH_RISK';
          const isLocked = item.isLockedOut;
          const isProcessing = confirmingId === med.id;

          const hindiPrompt = `${elder.fullName} जी, आपकी ${med.name} लेने का समय है। खुराक: ${med.dosage}। ${med.instructions || 'नाश्ते के बाद लें।'}`;

          return (
            <div
              key={med.id}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 border-4 shadow-2xl ${
                isLocked
                  ? 'bg-slate-900/90 border-emerald-600/60 ring-4 ring-emerald-500/20'
                  : isHighRisk
                  ? 'bg-gradient-to-b from-slate-900 via-rose-950/30 to-slate-900 border-amber-500/50 hover:border-amber-400'
                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
              }`}
            >
              {/* Top Badge & Time */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isHighRisk
                        ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                        : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                    }`}
                  >
                    {isHighRisk ? '⚠️ High Priority (अति-आवश्यक)' : 'Routine (दैनिक)'}
                  </span>

                  <div className="flex items-center gap-1.5 text-slate-300 font-mono font-bold text-sm bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{med.scheduleTimes.join(', ')}</span>
                  </div>
                </div>

                {/* Real Pill Photo */}
                <div className="relative rounded-2xl overflow-hidden mb-6 h-48 bg-slate-950 border-2 border-slate-700 flex items-center justify-center group">
                  {med.pillImageUrl ? (
                    <img
                      src={med.pillImageUrl}
                      alt={med.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-slate-500 text-sm font-semibold">गोली की फ़ोटो (Tablet Photo)</div>
                  )}

                  {/* Anti-Overdose Lockout Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                      <ShieldCheck className="w-16 h-16 text-emerald-300 animate-pulse mb-2" />
                      <span className="text-white font-extrabold text-lg">सुरक्षा कवच सक्रिय</span>
                      <span className="text-emerald-300 text-xs font-medium mt-1">
                        दवा ली जा चुकी है (Dose Confirmed)
                      </span>
                      <span className="text-slate-300 text-[11px] mt-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        अगली खुराक तक सुरक्षित लॉक
                      </span>
                    </div>
                  )}
                </div>

                {/* Medicine Title & Dosage */}
                <div className="space-y-2 mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {med.name}
                  </h2>
                  <div className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                    <span>खुराक: {med.dosage}</span>
                    <span className="text-slate-400 text-xs font-normal">({med.mealRelation.replace('_', ' ')})</span>
                  </div>

                  {med.instructions && (
                    <p className="text-slate-300 text-sm bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                      💡 {med.instructions}
                    </p>
                  )}

                  {/* Dietary Precautions */}
                  {med.dietaryGuidelines.length > 0 && (
                    <div className="space-y-1 mt-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        परहेज़ व भोजन निर्देश:
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {med.dietaryGuidelines.map((g, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Giant Touch Target */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                {/* Voice Guidance / Audio Helper */}
                <div className="flex gap-2">
                  <button
                    onClick={() => speakGuidance(hindiPrompt)}
                    disabled={speaking}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Volume2 className={`w-5 h-5 text-emerald-400 ${speaking ? 'animate-bounce' : ''}`} />
                    <span>{speaking ? 'बोल रहा हूँ...' : 'आवाज़ में सुनें (Listen)'}</span>
                  </button>

                  <button
                    onClick={() => startVoiceConfirmation(med.id, med.name)}
                    disabled={isLocked || listening}
                    className="py-3 px-4 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700 text-indigo-200 font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    title="बोलकर पुष्टि करें: 'मैंने खा ली'"
                  >
                    <Mic className={`w-5 h-5 text-indigo-400 ${listening ? 'animate-ping' : ''}`} />
                    <span>{listening ? 'सुन रहा हूँ...' : 'बोलें "खा ली"'}</span>
                  </button>
                </div>

                {/* Giant 80px Accessible Touch Target Button */}
                {isLocked ? (
                  <div className="w-full h-20 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center gap-3 text-emerald-300 font-black text-lg shadow-inner">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                    <span>सुरक्षित: दवा ले ली गई है ✔️</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirmDose(med.id, 'BUTTON_TAP')}
                    disabled={isProcessing}
                    className="w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xl sm:text-2xl shadow-xl shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer border-2 border-emerald-400"
                  >
                    <CheckCircle2 className="w-8 h-8 text-white shrink-0" />
                    <span>{isProcessing ? 'दर्ज हो रहा है...' : '✔️ मैंने ले ली (MAINE LE LI)'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Call Floating Bar */}
      <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">आपातकालीन संपर्क (Emergency Help)</h3>
            <p className="text-slate-400 text-sm">
              असहज महसूस होने या भूलने पर तुरंत अपनी बेटी प्रिया शर्मा या डॉक्टर को कॉल करें।
            </p>
          </div>
        </div>

        <a
          href={`tel:${elder.emergencyContact}`}
          className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all"
        >
          <PhoneCall className="w-5 h-5" />
          <span>कॉल करें: {elder.emergencyContact}</span>
        </a>
      </div>
    </div>
  );
};
