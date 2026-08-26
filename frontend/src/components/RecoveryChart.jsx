import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { PieChart as PieIcon, BarChart3, ArrowRight } from 'lucide-react';
import { formatINR } from './SummaryCards';

const ACTION_COLORS = {
  retry_payment: '#10b981',      // Emerald
  send_reminder_email: '#2563eb', // Royal Blue
  escalate_to_human: '#f59e0b',   // Amber
  skipped_stopping_rule: '#8b5cf6' // Purple
};

const ACTION_LABELS = {
  retry_payment: 'Retry Payment',
  send_reminder_email: 'Email Customer',
  escalate_to_human: 'Escalate to Human',
  skipped_stopping_rule: 'Guardrail Intercepted'
};

export default function RecoveryChart({ data }) {
  const breakdown = data?.breakdown || {
    retry_payment: 0,
    send_reminder_email: 0,
    escalate_to_human: 0,
    skipped_stopping_rule: 0
  };

  const pieData = Object.entries(breakdown).map(([key, value]) => ({
    name: ACTION_LABELS[key] || key,
    key,
    value: value || 0,
    color: ACTION_COLORS[key] || '#94a3b8'
  })).filter(item => item.value > 0);

  const totalEvaluated = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const financialComparisonData = [
    {
      name: 'At Risk',
      amountRupees: (data?.total_at_risk_paise || 0) / 100,
      fill: '#f59e0b',
    },
    {
      name: 'Recovered',
      amountRupees: (data?.total_recovered_paise || 0) / 100,
      fill: '#10b981',
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Claude Agent Decision Distribution */}
      <div className="theme-card p-5 sm:p-6 border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agent Recovery Branching</h3>
              <p className="text-xs text-slate-500 font-medium">Autonomous 3-Branch Decision Distribution</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {totalEvaluated} Total Decisions
          </span>
        </div>

        {pieData.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
            <p className="font-semibold text-slate-500">No actions logged yet.</p>
            <p className="mt-1">Trigger a simulated webhook or click "Seed Scenarios" above.</p>
          </div>
        ) : (
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between">
            <div className="w-full sm:w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="w-full sm:w-1/2 flex flex-col gap-2.5 pl-2 sm:pl-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Financial Recovery Progress */}
      <div className="theme-card p-5 sm:p-6 border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Financial Impact Overview</h3>
              <p className="text-xs text-slate-500 font-medium">At Risk vs Successfully Won Back</p>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '10px',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="amountRupees" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
