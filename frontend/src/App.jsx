import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import RecoveryChart from './components/RecoveryChart';
import AuditTable from './components/AuditTable';
import GuardrailsPanel from './components/GuardrailsPanel';
import WebhookSimulator from './components/WebhookSimulator';
import Footer from './components/Footer';
import { fetchDashboard, seedDemoData, resetDatabase } from './api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      showToast('Could not connect to Revenue Recovery API', 'error');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-polling every 10 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, loadData]);

  const handleSeedData = async () => {
    try {
      await seedDemoData();
      showToast('Successfully seeded test scenarios across all 3 branches');
      await loadData();
    } catch (err) {
      showToast('Failed to seed scenarios', 'error');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all recovery events and audit logs?')) return;
    try {
      await resetDatabase();
      showToast('Audit trail & database reset successfully');
      await loadData();
    } catch (err) {
      showToast('Failed to reset database', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold border ${
              notification.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        isAutoRefresh={isAutoRefresh}
        setIsAutoRefresh={setIsAutoRefresh}
        onRefresh={() => loadData(true)}
        onSeedData={handleSeedData}
        onResetData={handleResetData}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* KPI Cards */}
        <SummaryCards data={dashboardData} loading={loading} />

        {/* 1-Click Payment Recovery Test Lab */}
        <WebhookSimulator onEventProcessed={() => loadData()} />

        {/* Analytics Distribution Charts */}
        <RecoveryChart data={dashboardData} />

        {/* Guardrails Stopping Rules Panel */}
        <GuardrailsPanel guardrails={dashboardData?.guardrails} />

        {/* Immutable Audit Log Trail */}
        <AuditTable logs={dashboardData?.recent_audit_log || []} />
      </main>

      {/* Dedicated Proper Footer */}
      <Footer />
    </div>
  );
}
