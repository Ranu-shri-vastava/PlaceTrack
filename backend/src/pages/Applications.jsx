import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Edit2, Trash2, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationAPI, studentAPI, companyAPI } from '../utils/api';
import { statusColors, formatDate, pipelineStageColors } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const STATUSES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected', 'offer_accepted', 'offer_declined'];
const PIPELINE_STAGES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];

const EMPTY = { student: '', company: '', jobRole: '', aptitudeScore: '', technicalScore: '', hrScore: '', notes: '' };

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [view, setView] = useState('table'); // 'table' | 'pipeline'
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const [appRes, pipeRes] = await Promise.all([applicationAPI.getAll(params), applicationAPI.pipeline()]);
      setApps(appRes.data.data);
      setTotal(appRes.data.total);
      setPages(appRes.data.pages);
      setPipeline(pipeRes.data.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    studentAPI.getAll({ limit: 200 }).then(r => setStudents(r.data.data)).catch(() => {});
    companyAPI.getAll({ limit: 200 }).then(r => setCompanies(r.data.data)).catch(() => {});
  }, []);

  const openAdd = () => { setSelected(null); setForm(EMPTY); setModalOpen(true); };
  const openStatus = (app) => { setSelected(app); setNewStatus(app.status); setStatusNote(''); setStatusModal(true); };
  const openDelete = (app) => { setSelected(app); setDeleteDialog(true); };

  const handleSave = async () => {
    if (!form.student || !form.company || !form.jobRole) return toast.error('Student, Company and Job Role are required');
    setSaving(true);
    try {
      await applicationAPI.create(form);
      toast.success('Application created!');
      setModalOpen(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await applicationAPI.updateStatus(selected._id, { status: newStatus, note: statusNote });
      toast.success('Status updated!');
      setStatusModal(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await applicationAPI.delete(selected._id); toast.success('Deleted'); setDeleteDialog(false); load(); }
    catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const f = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const pipelineByStatus = {};
  PIPELINE_STAGES.forEach(s => {
    pipelineByStatus[s] = apps.filter(a => a.status === s);
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Applications</h2><p>{total} total applications</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
            <button className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('table')}>Table</button>
            <button className={`btn btn-sm ${view === 'pipeline' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('pipeline')}>Pipeline</button>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Application</button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {PIPELINE_STAGES.map(s => {
          const cfg = pipelineStageColors[s] || { bg: '#6366f1', light: '#e0e7ff' };
          return (
            <div key={s} style={{ background: 'white', border: `2px solid ${cfg.light}`, borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', transition: 'all .15s' }}
              onClick={() => { f('status', filters.status === s ? '' : s); setView('table'); }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.bg }} />
              <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{s}</span>
              <span style={{ fontWeight: 700, color: cfg.bg, fontSize: 16 }}>{pipeline[s] || 0}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div className="filters-row">
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={16} /><input placeholder="Search job role..." value={filters.search} onChange={e => f('search', e.target.value)} />
            </div>
            <select className="filter-select" value={filters.status} onChange={e => f('status', e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {PIPELINE_STAGES.map(stage => {
            const cfg = pipelineStageColors[stage];
            const stageApps = apps.filter(a => a.status === stage);
            return (
              <div key={stage} style={{ minWidth: 220, flex: '0 0 220px' }}>
                <div style={{ background: cfg?.bg || '#6366f1', borderRadius: '10px 10px 0 0', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{stage}</span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{pipeline[stage] || 0}</span>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', minHeight: 200, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageApps.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No applications</div>
                  ) : stageApps.map(app => (
                    <div key={app._id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{app.student?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b', margin: '2px 0' }}>{app.company?.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{app.jobRole}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => openStatus(app)}>
                          Move <ChevronDown size={11} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px', color: '#ef4444' }} onClick={() => openDelete(app)}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="card">
          <div className="table-wrapper">
            {loading ? <div className="loading-overlay"><div className="spinner" /></div>
              : apps.length === 0 ? (
                <div className="empty-state"><FileText size={48} /><h3>No applications found</h3><button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={15} />Add Application</button></div>
              ) : (
                <table>
                  <thead><tr><th>Student</th><th>Company</th><th>Job Role</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {apps.map(app => (
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
                        <td style={{ fontWeight: 500 }}>{app.jobRole}</td>
                        <td className="text-muted text-sm">{formatDate(app.appliedDate)}</td>
                        <td>
                          <span className={`badge ${statusColors[app.status] || 'badge-gray'}`} style={{ cursor: 'pointer' }} onClick={() => openStatus(app)} title="Click to change status">
                            {app.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" title="Change Status" onClick={() => openStatus(app)}><Edit2 size={13} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => openDelete(app)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
          {!loading && apps.length > 0 && <div style={{ padding: '0 16px 8px' }}><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Application"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : 'Add Application'}</button>
        </>}
      >
        <div className="form-group"><label className="form-label">Student *</label>
          <select className="form-control" value={form.student} onChange={e => setForm(p => ({ ...p, student: e.target.value }))}>
            <option value="">Select Student</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Company *</label>
          <select className="form-control" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}>
            <option value="">Select Company</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Job Role *</label>
          <input className="form-control" value={form.jobRole} onChange={e => setForm(p => ({ ...p, jobRole: e.target.value }))} placeholder="Software Engineer" />
        </div>
        <div className="grid-3">
          <div className="form-group"><label className="form-label">Aptitude Score</label><input className="form-control" type="number" value={form.aptitudeScore} onChange={e => setForm(p => ({ ...p, aptitudeScore: e.target.value }))} placeholder="85" /></div>
          <div className="form-group"><label className="form-label">Technical Score</label><input className="form-control" type="number" value={form.technicalScore} onChange={e => setForm(p => ({ ...p, technicalScore: e.target.value }))} placeholder="78" /></div>
          <div className="form-group"><label className="form-label">HR Score</label><input className="form-control" type="number" value={form.hrScore} onChange={e => setForm(p => ({ ...p, hrScore: e.target.value }))} placeholder="90" /></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Application Status" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setStatusModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={saving}>{saving ? <span className="spinner" /> : 'Update'}</button>
        </>}
      >
        <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
          <div style={{ fontWeight: 600 }}>{selected?.student?.name}</div>
          <div className="text-xs text-muted">{selected?.company?.name} · {selected?.jobRole}</div>
        </div>
        <div className="form-group"><label className="form-label">New Status</label>
          <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Note (optional)</label>
          <textarea className="form-control" rows={2} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Reason for status change..." />
        </div>
        {selected?.statusHistory?.length > 0 && (
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: 8 }}>STATUS HISTORY</div>
            <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...selected.statusHistory].reverse().map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, padding: '4px 8px', background: '#f8fafc', borderRadius: 6 }}>
                  <span className={`badge ${statusColors[h.status] || 'badge-gray'}`} style={{ fontSize: 10 }}>{h.status}</span>
                  <span className="text-muted">{formatDate(h.date)}</span>
                  {h.note && <span style={{ color: '#475569' }}>— {h.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Application" message="Delete this application? This cannot be undone." />
    </div>
  );
}
