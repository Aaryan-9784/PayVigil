import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import RecoveryChart from './components/RecoveryChart';
import AuditTable from './components/AuditTable';
import WebhookSimulator from './components/WebhookSimulator';
import Footer from './components/Footer';
import { fetchDashboard, seedDemoData, resetDatabase } from './api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      showToast('Could not connect to server', 'error');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-polling every 10 seconds (always on)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSeedData = async () => {
    try {
      await seedDemoData();
      showToast('Loaded demo transactions successfully');
      await loadData();
    } catch (err) {
      showToast('Failed to load demo data', 'error');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all logs and transactions?')) return;
    try {
      await resetDatabase();
      showToast('Database reset successfully');
      await loadData();
    } catch (err) {
      showToast('Failed to reset database', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 transition-all">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border ${
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
        onRefresh={() => loadData(true)}
        onSeedData={handleSeedData}
        onResetData={handleResetData}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* KPI Summary Cards */}
        <SummaryCards data={dashboardData} loading={loading} />

        {/* Interactive Test Simulator */}
        <WebhookSimulator onEventProcessed={() => loadData()} />

        {/* Analytics Distribution Charts */}
        <RecoveryChart data={dashboardData} />

        {/* Activity & Recovery Log */}
        <AuditTable logs={dashboardData?.recent_audit_log || []} />
      </main>

      {/* Clean Footer */}
      <Footer />
    </div>
  );
}


