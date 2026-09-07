import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Users, Building2, FileText, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../utils/api';
import { statusColors, getInitials } from '../utils/helpers';

const TYPE_LABELS = { product: 'Product', service: 'Service', startup: 'Startup', mnc: 'MNC', psu: 'PSU', other: 'Other' };

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], companies: [], applications: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 350);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults({ students: [], companies: [], applications: [] });
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await aiAPI.search({ q: q.trim(), type: activeTab === 'all' ? undefined : activeTab });
      setResults(res.data.data);
      setSearched(true);
    } catch {
      setResults({ students: [], companies: [], applications: [] });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clear = () => {
    setQuery('');
    setResults({ students: [], companies: [], applications: [] });
    setSearched(false);
    inputRef.current?.focus();
  };

  const totalResults = (results.students?.length || 0) + (results.companies?.length || 0) + (results.applications?.length || 0);

  const showStudents = activeTab === 'all' || activeTab === 'students';
  const showCompanies = activeTab === 'all' || activeTab === 'companies';
  const showApplications = activeTab === 'all' || activeTab === 'applications';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Search</h2>
          <p>Search across students, companies, and applications</p>
        </div>
      </div>

      {/* Search box */}
      <div className="card" style={{ marginBottom: 20, padding: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#f8fafc', border: '2px solid #e2e8f0',
          borderRadius: 14, padding: '10px 16px',
          transition: 'border .2s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#6366f1'}
          onBlurCapture={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <Search size={20} color={loading ? '#6366f1' : '#94a3b8'} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, roll number, email, skill, company, industry..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, fontFamily: 'inherit', color: '#1e293b',
            }}
          />
          {loading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, flexShrink: 0 }} />}
          {query && !loading && (
            <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}>
              <X size={18} />
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, marginLeft: 4 }}>
          Type at least 2 characters to search · Searches names, emails, roll numbers, skills, industries
        </p>
      </div>

      {/* Tabs */}
      {searched && (
        <div className="tabs">
          {[
            { key: 'all', label: `All (${totalResults})` },
            { key: 'students', label: `Students (${results.students?.length || 0})` },
            { key: 'companies', label: `Companies (${results.companies?.length || 0})` },
            { key: 'applications', label: `Applications (${results.applications?.length || 0})` },
          ].map(t => (
            <div
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}

      {/* No query state */}
      {!query && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 80, height: 80, background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Search size={36} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Search Everything</h3>
          <p style={{ color: '#64748b', maxWidth: 380, margin: '0 auto', lineHeight: 1.7 }}>
            Find students by name, roll number, skills or department.
            Find companies by name, industry or location.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            {['React', 'CSE', 'Google', 'Python', 'IT/Software', 'Finance'].map(t => (
              <button key={t} onClick={() => setQuery(t)}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && totalResults === 0 && !loading && (
        <div className="empty-state">
          <Search size={48} />
          <h3>No results for "{query}"</h3>
          <p>Try different keywords — name, roll number, skill, or company name</p>
        </div>
      )}

      {/* Students results */}
      {showStudents && results.students?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={17} color="#6366f1" />
              <span className="card-title">Students ({results.students.length})</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/students')}>
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>CGPA</th>
                  <th>Skills</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.students.map(s => (
                  <tr key={s._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/students')}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: '#e0e7ff', color: '#6366f1' }}>
                          {getInitials(s.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div className="text-xs text-muted">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{s.rollNumber}</td>
                    <td>{s.department}</td>
                    <td>{s.batch}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.cgpa >= 8 ? '#22c55e' : s.cgpa >= 6 ? '#f59e0b' : '#ef4444' }}>
                        {s.cgpa || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(s.skills || []).slice(0, 3).map(sk => (
                          <span key={sk} className="badge badge-purple" style={{ fontSize: 10 }}>{sk}</span>
                        ))}
                        {(s.skills?.length || 0) > 3 && (
                          <span className="badge badge-gray" style={{ fontSize: 10 }}>+{s.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[s.placementStatus] || 'badge-gray'}`}>
                        {s.placementStatus?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Companies results */}
      {showCompanies && results.companies?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={17} color="#8b5cf6" />
              <span className="card-title">Companies ({results.companies.length})</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/companies')}>
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {results.companies.map(c => (
              <div key={c._id}
                onClick={() => navigate('/companies')}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f5f3ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <div className="avatar" style={{ background: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div className="text-xs text-muted">{c.industry}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>{TYPE_LABELS[c.type] || c.type}</span>
                  {c.location && <span className="badge badge-gray" style={{ fontSize: 10 }}>📍 {c.location}</span>}
                  {c.packageOffered?.max && (
                    <span className="badge badge-success" style={{ fontSize: 10 }}>💰 Up to {c.packageOffered.max} LPA</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications results */}
      {showApplications && results.applications?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={17} color="#0ea5e9" />
              <span className="card-title">Applications ({results.applications.length})</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/applications')}>
              View All <ExternalLink size={12} />
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company</th>
                  <th>Job Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.applications.map(a => (
                  <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/applications')}>
                    <td style={{ fontWeight: 500 }}>{a.student?.name || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{a.company?.name || '—'}</td>
                    <td>{a.jobRole}</td>
                    <td>
                      <span className={`badge ${statusColors[a.status] || 'badge-gray'}`}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
