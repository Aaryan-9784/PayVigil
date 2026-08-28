import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import WebhookSimulator from './components/WebhookSimulator';
import RecoveryChart from './components/RecoveryChart';
import AuditTable from './components/AuditTable';
import Footer from './components/Footer';
import { fetchDashboard, seedDemoData, resetDatabase } from './api';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      showToast('Could not connect to server', 'error');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(), 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSeedData = async () => {
    try {
      await seedDemoData();
      showToast('Demo transactions loaded successfully');
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
    <div className="min-h-screen flex flex-col grid-bg text-[#0c2340]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Premium Toast Notification (Razorpay Theme) */}
      {notification && (
        <div
          className="fixed bottom-5 right-5 z-50"
          style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}
        >
          <div
            className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl text-xs font-semibold shadow-lg"
            style={
              notification.type === 'error'
                ? {
                    background: 'rgba(254, 226, 226, 0.95)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#991b1b',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 10px 25px -3px rgba(239, 68, 68, 0.2)',
                  }
                : {
                    background: 'rgba(240, 247, 255, 0.98)',
                    border: '1px solid rgba(12, 131, 255, 0.5)',
                    color: '#004797',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 10px 25px -3px rgba(12, 131, 255, 0.25)',
                  }
            }
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0c83ff]" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-1 p-0.5 rounded-md transition-opacity opacity-60 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <Header
        onRefresh={() => loadData(true)}
        onSeedData={handleSeedData}
        onResetData={handleResetData}
        isRefreshing={isRefreshing}
      />

      {/* Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6 flex-1 w-full">
        {/* 1. Key Metrics & Financial Recovery KPIs */}
        <SummaryCards data={dashboardData} loading={loading} />

        {/* 2. Interactive Scenario Simulator (Sandbox) */}
        <WebhookSimulator onEventProcessed={() => loadData()} />

        {/* 3. Revenue Recovery Analytics & Resolution Distribution */}
        <RecoveryChart data={dashboardData} />

        {/* 4. Immutable Audit Trail & AI Diagnostic Inspector */}
        <AuditTable logs={dashboardData?.recent_audit_log || []} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
