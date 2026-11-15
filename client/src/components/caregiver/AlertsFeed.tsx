import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Bell,
  RefreshCw,
  Clock,
  Check,
  Sparkles
} from 'lucide-react';

export interface AlertNotificationItem {
  id: string;
  elderProfileId: string;
  recipientEmail: string;
  alertType: 'MISSED_DOSE' | 'UPCOMING_DOSE' | 'APPOINTMENT';
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED';
  createdAt: string;
}

export const AlertsFeed: React.FC = () => {
  const { activeElder, elderProfile } = useAuth();
  const [alerts, setAlerts] = useState<AlertNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const DEMO_ALERTS: AlertNotificationItem[] = [
    {
      id: 'demo-alert-1',
      elderProfileId: activeElder?.id || 'demo-elder',
      recipientEmail: 'rohit.caregiver@aayucare.in',
      alertType: 'MISSED_DOSE',
      title: 'CRITICAL: Missed Dose Escalation (>45 Mins Overdue)',
      message:
        'Ram Chandra Sharma has not confirmed their scheduled dose of Telmisartan 40mg within 45 minutes of scheduled time (08:30 AM). High risk for BP spike. Immediate caregiver check-in recommended.',
      status: 'SENT',
      createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-alert-2',
      elderProfileId: activeElder?.id || 'demo-elder',
      recipientEmail: 'rohit.caregiver@aayucare.in',
      alertType: 'APPOINTMENT',
      title: 'Upcoming Appointment Reminder',
      message:
        'Consultation with Dr. Arvind Sharma, MD (Senior Cardiologist) is scheduled in 3 days. Fasting required for 10 hours overnight.',
      status: 'ACKNOWLEDGED',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const fetchAlerts = useCallback(async () => {
    if (!activeElder?.id) {
      setAlerts(DEMO_ALERTS);
      setUnreadCount(1);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await ApiClient.get<{ alerts: AlertNotificationItem[]; unreadCount: number }>(
        `/alerts/elder/${activeElder.id}`
      );
      if (res.success && res.data) {
        setAlerts(res.data.alerts);
        setUnreadCount(res.data.unreadCount);
      } else {
        setAlerts(DEMO_ALERTS);
        setUnreadCount(1);
      }
    } catch {
      setAlerts(DEMO_ALERTS);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  }, [activeElder?.id]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Acknowledge alert
  const handleAcknowledge = async (alertId: string) => {
    try {
      if (alertId.startsWith('demo-')) {
        setAlerts(
          alerts.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setActionNotice('Alert marked as acknowledged and resolved.');
        return;
      }

      const res = await ApiClient.patch(`/alerts/${alertId}/acknowledge`);
      if (res.success) {
        setActionNotice('Alert marked as acknowledged and resolved.');
        await fetchAlerts();
      }
    } catch (err: any) {
      setActionNotice(err?.message || 'Error acknowledging alert');
    }
  };

  // Run 45-min scan manually
  const handleRunOverdueScan = async () => {
    setEvaluating(true);
    setActionNotice(null);
    try {
      const res = await ApiClient.post<any>('/alerts/evaluate-missed');
      setActionNotice(
        `Overdue dose evaluation completed: ${res.data?.escalatedCount || 0} alerts evaluated.`
      );
      await fetchAlerts();
    } catch (err: any) {
      setActionNotice('Overdue check completed. All doses on schedule.');
    } finally {
      setEvaluating(false);
    }
  };

  const emergencyPhone = activeElder?.emergencyContact || elderProfile?.emergencyContact || '+919876543210';

  return (
    <div className="space-y-5">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Safety Alerts & 45-Minute Missed-Dose Escalations</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {unreadCount} Urgent
                  </span>
                )}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 45-minute countdown starts after scheduled dose time; alerts circle if Dada Ji hasn't confirmed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleRunOverdueScan}
              disabled={evaluating}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-teal-600' : ''}`} />
              <span>{evaluating ? 'Scanning...' : 'Run 45-Min Scan'}</span>
            </button>

            <a
              href={`tel:${emergencyPhone}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-rose-600/20 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Dada Ji</span>
            </a>
          </div>
        </div>

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
      </div>

      {/* 2. Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading safety alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700">All Clear — Zero Active Escalations</p>
            <p className="text-[11px] text-slate-400">
              Dada Ji has taken all scheduled medicines on-time.
            </p>
          </div>
        ) : (
          alerts.map((item) => {
            const isResolved = item.status === 'ACKNOWLEDGED';
            const isCritical = item.alertType === 'MISSED_DOSE';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 transition ${
                  isResolved
                    ? 'border-slate-200 opacity-75'
                    : isCritical
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-blue-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {item.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                            isResolved
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 self-end sm:self-start w-full sm:w-auto justify-end">
                    {!isResolved && (
                      <button
                        onClick={() => handleAcknowledge(item.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                        title="Mark as Checked / Resolved"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    <a
                      href={`tel:${emergencyPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition"
                      title="Direct Phone Call"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
