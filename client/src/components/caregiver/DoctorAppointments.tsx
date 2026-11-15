import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { Appointment } from '../../types';
import { ClinicalBriefcaseModal } from './ClinicalBriefcaseModal';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

export const DoctorAppointments: React.FC = () => {
  const { activeElder } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBriefcaseOpen, setIsBriefcaseOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Form states for new appointment
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Senior Cardiologist');
  const [clinicAddress, setClinicAddress] = useState('Max Super Speciality Hospital, Saket, New Delhi');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [prepNotes, setPrepNotes] = useState('10 hours overnight fasting required for Lipid Profile & HbA1c test.');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!activeElder?.id) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await ApiClient.get<Appointment[]>(`/appointments/elder/${activeElder.id}`);
      if (res.success && res.data) {
        setAppointments(res.data);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeElder?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !appointmentDate) {
      setError('Please provide Doctor Name and Date/Time.');
      return;
    }

    if (!activeElder?.id) {
      setError('Please select or link an elder before scheduling an appointment.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await ApiClient.post<Appointment>('/appointments', {
        elderProfileId: activeElder.id,
        doctorName: doctorName.trim(),
        specialty: specialty.trim() || 'General Medicine',
        clinicAddress: clinicAddress.trim() || 'City Clinic',
        appointmentDate: new Date(appointmentDate).toISOString(),
        prepNotes: prepNotes.trim() || null
      });

      if (res.success) {
        setIsScheduleOpen(false);
        setDoctorName('');
        setSpecialty('');
        setClinicAddress('');
        setAppointmentDate('');
        await fetchAppointments();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Doctor Appointments & Clinical Briefcase
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fasting checklists, clinic locations, and 1-click 30-day compliance dossier for your physician.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setIsBriefcaseOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-teal-600/20 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>30-Day Clinical Briefcase</span>
            </button>

            <button
              onClick={() => setIsScheduleOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book / Log Visit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Appointments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No doctor visits scheduled</p>
            <p className="text-[11px] text-slate-400">
              Click "Schedule Appointment" to record upcoming clinical visits and generate 30-day Briefcase reports.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 hover:border-teal-200 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {appt.doctorName}
                      </h3>
                      <p className="text-xs font-semibold text-teal-700">
                        {appt.specialty}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {appt.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      {new Date(appt.appointmentDate).toLocaleString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{appt.clinicAddress}</span>
                  </div>
                </div>

                {appt.prepNotes && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Patient Prep / Fasting Checklist:</span>
                      <span className="text-[11px] text-amber-800 leading-relaxed">
                        {appt.prepNotes}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setIsBriefcaseOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open 30-Day Dossier for Dr. Sharma</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Schedule Appointment Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Schedule Doctor Visit
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Arvind Sharma, MD"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Cardiology"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Clinic / Hospital Address</label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="e.g. Max Hospital Saket, New Delhi"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Prep / Fasting Notes</label>
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. 10 hours overnight fasting required for Lipid Profile..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  {saving ? 'Scheduling...' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Clinical Briefcase Modal */}
      <ClinicalBriefcaseModal
        isOpen={isBriefcaseOpen}
        onClose={() => setIsBriefcaseOpen(false)}
        elderProfileId={activeElder?.id || 'demo-elder-id'}
      />
    </div>
  );
};
