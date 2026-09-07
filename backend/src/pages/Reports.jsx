import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../utils/api';

const COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.reports();
      setData(res.data.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="loading-overlay" style={{ flexDirection: 'column', gap: 12 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p className="text-muted">Loading reports...</p>
    </div>
  );

  if (!data) return (
    <div className="empty-state">
      <BarChart3 size={48} />
      <h3>No data available</h3>
      <p>Add students, companies and placements to see reports</p>
      <button className="btn btn-primary mt-4" onClick={load}>Retry</button>
    </div>
  );

  const { deptWise = [], batchWise = [], companyWise = [], packageDist = [], monthlyPlacements = [], skillsDemand = [] } = data;

  // Format monthly trend
  const monthlyData = monthlyPlacements.map(m => ({
    name: `${MONTHS[(m._id.month || 1) - 1]} ${m._id.year}`,
    placements: m.count,
    avgCTC: m.avgCTC ? Number(m.avgCTC.toFixed(1)) : 0,
  }));

  // Format package distribution
  const pkgData = packageDist.map(p => ({
    name: p._id === '50+' ? '50+ LPA' : `${p._id}–${Number(p._id) + 3} LPA`,
    count: p.count,
  }));

  const noData = (arr) => !arr || arr.length === 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Detailed placement drive insights</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Row 1: Department-wise + Batch-wise */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Department-wise Placement Rate</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {noData(deptWise) ? <div className="empty-state" style={{ padding: 40 }}><p>No data</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptWise} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v, n) => [n === 'rate' ? `${v.toFixed(1)}%` : v, n === 'rate' ? 'Rate' : 'Total']} />
                  <Bar dataKey="rate" name="rate" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Batch-wise Comparison</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {noData(batchWise) ? <div className="empty-state" style={{ padding: 40 }}><p>No data</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchWise} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="total" name="Total" fill="#e0e7ff" radius={[4,4,0,0]} />
                  <Bar dataKey="placed" name="Placed" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Monthly trend + Package Distribution */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Placement Trend</span>
          </div>
          <div className="card-body" style={{ height: 260 }}>
            {noData(monthlyData) ? <div className="empty-state" style={{ padding: 40 }}><p>No placement data yet</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}L`} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                  <Line yAxisId="left" type="monotone" dataKey="placements" name="Placements" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgCTC" name="Avg CTC (LPA)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Package Distribution</span>
          </div>
          <div className="card-body" style={{ height: 260 }}>
            {noData(pkgData) ? <div className="empty-state" style={{ padding: 40 }}><p>No placement data yet</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pkgData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Students" radius={[6,6,0,0]}>
                    {pkgData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Companies + Skills Demand */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Recruiting Companies</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {noData(companyWise) ? <div className="empty-state" style={{ padding: 40 }}><p>No data</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyWise.slice(0, 10)} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v, n) => [n === 'avgCTC' ? `${Number(v).toFixed(1)} LPA` : v, n === 'avgCTC' ? 'Avg CTC' : 'Placed']} />
                  <Bar dataKey="count" name="Placed" fill="#22c55e" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Skills in Demand</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {noData(skillsDemand) ? <div className="empty-state" style={{ padding: 40 }}><p>No skill data yet</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillsDemand.slice(0, 10)} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Times Selected" fill="#8b5cf6" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Department-wise Summary Table</span>
        </div>
        <div className="table-wrapper">
          {noData(deptWise) ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No department data</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Students</th>
                  <th>Placed</th>
                  <th>Not Placed</th>
                  <th>Placement Rate</th>
                </tr>
              </thead>
              <tbody>
                {deptWise.map(d => (
                  <tr key={d.department || d._id}>
                    <td style={{ fontWeight: 600 }}>{d.department || d._id || '—'}</td>
                    <td>{d.total}</td>
                    <td style={{ color: '#22c55e', fontWeight: 600 }}>{d.placed}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{d.total - d.placed}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(d.rate || 0, 100).toFixed(0)}%`,
                            height: '100%',
                            background: d.rate >= 70 ? '#22c55e' : d.rate >= 40 ? '#f59e0b' : '#ef4444',
                            borderRadius: 4,
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, minWidth: 36, fontSize: 12 }}>
                          {(d.rate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
