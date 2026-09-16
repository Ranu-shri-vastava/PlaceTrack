import React from 'react';

export default function StatCard({ icon: Icon, label, value, color = '#6366f1', lightColor = '#e0e7ff', change, changeLabel }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: lightColor }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {change !== undefined && (
          <div className={`stat-change ${Number(change) >= 0 ? 'up' : 'down'}`}>
            {Number(change) >= 0 ? '▲' : '▼'} {Math.abs(change)}% {changeLabel}
          </div>
        )}
      </div>
    </div>
  );
}
