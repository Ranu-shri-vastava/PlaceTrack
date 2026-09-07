import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  Users, Building2, FileText, CalendarCheck, Trophy,
  TrendingUp, Clock, CheckCircle, XCircle, ArrowRight, RefreshCw
} from 'lucide-react';
import { dashboardAPI } from '../utils/api';
import { formatDate, statusColors } from '../utils/helpers';
import StatCard from '../components/StatCard';

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'];

const PIPELINE_CONFIG = [
  { key: 'applied',     label: 'Applied',     color: '#6366f1' },
  { key: 'shortlisted', label: 'Shortlisted',  color: '#0ea5e9' },
  { key: 'interview',   label: 'Interview',    color: '#f59e0b' },
  { key: 'selected',    label: 'Selected',     color: '#22c55e' },
  { key: 'rejected',    label: 'Rejected',     color: '#ef4444' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.stats();
      setData(res.data.data);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="loading-overlay">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px', borderWidth: 3 }} />
        <p className="text-muted">Loading dashboard...</p>
      </div>
    </div>
  );

  const ov = data?.overview || {};
  const pipeline = data?.pipeline || {};
  const recentApps = data?.recentApplications || [];
  const recentPlacements = data?.recentPlacements || [];

  const pipelineChartData = PIPELINE_CONFIG.map(p => ({ name: p.label, value: pipeline[p.key] || 0, color: p.color }));

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back! Here's your placement drive overview.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard icon={Users}        label="Total Students"    value={ov.totalStudents}    color="#6366f1" lightColor="#e0e7ff" />
        <StatCard icon={CheckCircle}  label="Placed Students"   value={ov.placedStudents}   color="#22c55e" lightColor="#dcfce7" />
        <StatCard icon={TrendingUp}   label="Placement Rate"    value={`${ov.placementRate}%`} color="#0ea5e9" lightColor="#e0f2fe" />
        <StatCard icon={Building2}    label="Companies"         value={ov.totalCompanies}   color="#8b5cf6" lightColor="#ede9fe" />
        <StatCard icon={FileText}     label="Applications"      value={ov.totalApplications} color="#f59e0b" lightColor="#fef3c7" />
        <StatCard icon={CalendarCheck} label="Upcoming Interviews" value={ov.upcomingInterviews} color="#06b6d4" lightColor="#cffafe" />
        <StatCard icon={Trophy}       label="Avg Package"       value={`${ov.avgPackage} LPA`} color="#22c55e" lightColor="#dcfce7" />
        <StatCard icon={Trophy}       label="Highest Package"   value={`${ov.maxPackage} LPA`} color="#ef4444" lightColor="#fee2e2" />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Pipeline funnel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Application Pipeline</span>
            <Link to="/applications" className="btn btn-ghost btn-sm">View All <ArrowRight size={13} /></Link>
          </div>
          <div className="card-body">
            {PIPELINE_CONFIG.map(p => {
              const count = pipeline[p.key] || 0;
              const total = Object.values(pipeline).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={p.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{p.label}</span>
                    <span style={{ color: p.color, fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 6, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie chart - placement status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Application Status</span>
          </div>
          <div className="card-body" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pipelineChartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pipelineChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pipeline bar chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Pipeline Overview (Bar)</span>
        </div>
        <div className="card-body" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineChartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                {pipelineChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid-2">
        {/* Recent Applications */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Applications</span>
            <Link to="/applications" className="btn btn-ghost btn-sm">View All <ArrowRight size={13} /></Link>
          </div>
          <div className="table-wrapper">
            {recentApps.length === 0 ? (
              <div className="empty-state"><FileText /><h3>No applications yet</h3></div>
            ) : (
              <table>
                <thead><tr><th>Student</th><th>Company</th><th>Status</th></tr></thead>
                <tbody>
                  {recentApps.map(app => (
                    <tr key={app._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{app.student?.name?.[0] || '?'}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{app.student?.name || '—'}</div>
                            <div className="text-xs text-muted">{app.student?.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{app.company?.name || '—'}</div>
                        <div className="text-xs text-muted">{app.company?.industry}</div>
                      </td>
                      <td><span className={`badge ${statusColors[app.status] || 'badge-gray'}`}>{app.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Placements */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Placements 🎉</span>
            <Link to="/placements" className="btn btn-ghost btn-sm">View All <ArrowRight size={13} /></Link>
          </div>
          <div className="table-wrapper">
            {recentPlacements.length === 0 ? (
              <div className="empty-state"><Trophy /><h3>No placements yet</h3></div>
            ) : (
              <table>
                <thead><tr><th>Student</th><th>Company</th><th>Package</th></tr></thead>
                <tbody>
                  {recentPlacements.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm" style={{ background: '#dcfce7', color: '#16a34a' }}>{p.student?.name?.[0] || '?'}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.student?.name || '—'}</div>
                            <div className="text-xs text-muted">{p.student?.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td><div style={{ fontWeight: 500 }}>{p.company?.name || '—'}</div></td>
                      <td><span style={{ fontWeight: 700, color: '#22c55e' }}>{p.package?.ctc} LPA</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
