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
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

const ACTION_CONFIG = {
  retry_payment: { label: 'Payment Retry', color: '#10b981' },
  send_reminder_email: { label: 'Customer Email', color: '#3b82f6' },
  escalate_to_human: { label: 'Support Review', color: '#f59e0b' },
  skipped_stopping_rule: { label: 'Safety Cooldown', color: '#8b5cf6' }
};

export default function RecoveryChart({ data }) {
  const breakdown = data?.breakdown || {
    retry_payment: 0,
    send_reminder_email: 0,
    escalate_to_human: 0,
    skipped_stopping_rule: 0
  };

  const pieData = Object.entries(breakdown)
    .map(([key, value]) => ({
      name: ACTION_CONFIG[key]?.label || key,
      value: value || 0,
      color: ACTION_CONFIG[key]?.color || '#94a3b8'
    }))
    .filter((item) => item.value > 0);

  const totalActions = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const financialData = [
    {
      name: 'Failed Amount',
      amount: (data?.total_at_risk_paise || 0) / 100,
      fill: '#f59e0b',
    },
    {
      name: 'Recovered Amount',
      amount: (data?.total_recovered_paise || 0) / 100,
      fill: '#10b981',
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Action Distribution */}
      <div className="theme-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Actions Taken</h3>
              <p className="text-xs text-slate-500">Breakdown of recovery methods</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {totalActions} Total
          </span>
        </div>

        {pieData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
            <p className="font-medium text-slate-500">No actions recorded yet.</p>
            <p className="mt-1">Click "Load Demo Data" above to view statistics.</p>
          </div>
        ) : (
          <div className="h-56 flex flex-col sm:flex-row items-center justify-between">
            <div className="w-full sm:w-1/2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full sm:w-1/2 flex flex-col gap-2 pl-2 sm:pl-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Financial Overview */}
      <div className="theme-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Comparison</h3>
              <p className="text-xs text-slate-500">Failed volume vs recovered revenue</p>
            </div>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

