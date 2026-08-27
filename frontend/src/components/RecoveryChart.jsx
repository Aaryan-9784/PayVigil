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
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

const ACTION_CONFIG = {
  retry_payment:         { label: 'Payment Retry',   color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  send_reminder_email:   { label: 'Customer Email',  color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  escalate_to_human:     { label: 'Support Review',  color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  skipped_stopping_rule: { label: 'Safety Cooldown', color: '#c084fc', bg: 'rgba(192,132,252,0.15)' }
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 12,
          padding: '10px 16px',
          fontSize: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <p className="font-bold text-slate-200">{payload[0]?.name}</p>
        <p className="font-extrabold text-sm mt-1" style={{ color: payload[0]?.payload?.color || '#a78bfa' }}>
          {payload[0]?.value} Action{payload[0]?.value > 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

const FinancialTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 12,
          padding: '10px 16px',
          fontSize: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <p className="font-bold text-slate-200">{payload[0]?.payload?.name}</p>
        <p className="font-extrabold text-sm mt-1" style={{ color: payload[0]?.payload?.fill }}>
          ₹{Number(payload[0]?.value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export default function RecoveryChart({ data }) {
  const breakdown = data?.breakdown || {
    retry_payment: 0,
    send_reminder_email: 0,
    escalate_to_human: 0,
    skipped_stopping_rule: 0,
  };

  const pieData = Object.entries(breakdown)
    .map(([key, value]) => ({
      name:  ACTION_CONFIG[key]?.label || key,
      value: value || 0,
      color: ACTION_CONFIG[key]?.color || '#94a3b8',
      bg:    ACTION_CONFIG[key]?.bg || 'rgba(255,255,255,0.05)'
    }))
    .filter((item) => item.value > 0);

  const totalActions = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const financialData = [
    { name: 'Failed Volume',    amount: (data?.total_at_risk_paise    || 0) / 100, fill: '#fbbf24' },
    { name: 'Recovered Revenue', amount: (data?.total_recovered_paise  || 0) / 100, fill: '#34d399' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Action Distribution */}
      <div className="glass-card p-6 fade-in-delay-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-blue">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Recovery Action Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Breakdown of automated resolution types</p>
              </div>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-indigo-300 bg-indigo-500/15 border border-indigo-500/30"
            >
              {totalActions} Total Events
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center gap-3 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <PieIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">No actions recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Load Demo Data" or trigger simulation above</p>
              </div>
            </div>
          ) : (
            <div className="h-60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-1/2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#060b18"
                          strokeWidth={3}
                          style={{ filter: `drop-shadow(0 0 8px ${entry.color}66)` }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="w-full sm:w-1/2 flex flex-col gap-2.5">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs py-2 px-3 rounded-xl border"
                    style={{
                      background: item.bg,
                      borderColor: `${item.color}33`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                      />
                      <span className="font-semibold text-slate-200">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-sm" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Financial Overview */}
      <div className="glass-card p-6 fade-in-delay-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-emerald">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Revenue Performance</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Failed payment volume vs successfully recovered</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <TrendingUp className="w-4 h-4" /> Live ROI
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<FinancialTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={70}>
                  {financialData.map((entry, index) => (
                    <Cell
                      key={`bar-cell-${index}`}
                      fill={entry.fill}
                      style={{ filter: `drop-shadow(0 0 10px ${entry.fill}88)` }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
