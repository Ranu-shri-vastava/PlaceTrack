import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Edit2, Trash2, Eye, Search, TrendingUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { placementAPI, studentAPI, companyAPI, applicationAPI } from '../utils/api';
import { statusColors, formatDate, DEPARTMENTS, BATCHES } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const EMPTY = {
  student: '', company: '', application: '',
  jobRole: '', type: 'full_time', status: 'offered',
  'package.ctc': '', 'package.inHand': '', 'package.bond': 0,
  joiningDate: '', offerLetterDate: '',
  location: '', stipend: '', duration: '', notes: '',
};

const TYPE_LABELS = {
  full_time: 'Full Time', internship: 'Internship',
  internship_ppo: 'Internship + PPO', part_time: 'Part Time'
};
const TYPE_COLORS = {
  full_time: 'badge-success', internship: 'badge-info',
  internship_ppo: 'badge-purple', part_time: 'badge-warning'
};

export default function Placements() {
  const [placements, setPlacements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ type: '', status: '', department: '', batch: '' });
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: 15,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      };
      const [plRes, stRes] = await Promise.all([
        placementAPI.getAll(params),
        placementAPI.stats(),
      ]);
      setPlacements(plRes.data.data);
      setTotal(plRes.data.total);
      setPages(plRes.data.pages);
      setStats(stRes.data.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    studentAPI.getAll({ limit: 200 }).then(r => setStudents(r.data.data)).catch(() => {});
    companyAPI.getAll({ limit: 200 }).then(r => setCompanies(r.data.data)).catch(() => {});
    applicationAPI.getAll({ limit: 200 }).then(r => setApplications(r.data.data)).catch(() => {});
  }, []);

  const openAdd = () => { setSelected(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({
      ...EMPTY, ...p,
      student: p.student?._id || p.student || '',
      company: p.company?._id || p.company || '',
      application: p.application?._id || p.application || '',
      'package.ctc': p.package?.ctc || '',
      'package.inHand': p.package?.inHand || '',
      'package.bond': p.package?.bond || 0,
      joiningDate: p.joiningDate ? p.joiningDate.slice(0, 10) : '',
      offerLetterDate: p.offerLetterDate ? p.offerLetterDate.slice(0, 10) : '',
      stipend: p.stipend || '',
      duration: p.duration || '',
    });
    setModalOpen(true);
  };
  const openView = (p) => { setSelected(p); setViewModal(true); };
  const openDelete = (p) => { setSelected(p); setDeleteDialog(true); };

  const handleSave = async () => {
    if (!form.student || !form.company || !form.jobRole || !form['package.ctc']) {
      return toast.error('Student, Company, Job Role and CTC are required');
    }
    setSaving(true);
    try {
      const payload = {
        student: form.student,
        company: form.company,
        application: form.application || undefined,
        jobRole: form.jobRole,
        type: form.type,
        status: form.status,
        location: form.location,
        notes: form.notes,
        joiningDate: form.joiningDate || undefined,
        offerLetterDate: form.offerLetterDate || undefined,
        stipend: form.stipend ? Number(form.stipend) : undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        package: {
          ctc: Number(form['package.ctc']),
          inHand: form['package.inHand'] ? Number(form['package.inHand']) : undefined,
          bond: Number(form['package.bond']) || 0,
        },
      };
      if (selected) {
        await placementAPI.update(selected._id, payload);
        toast.success('Placement updated!');
      } else {
        await placementAPI.create(payload);
        toast.success('Placement recorded! 🎉');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await placementAPI.delete(selected._id);
      toast.success('Placement deleted');
      setDeleteDialog(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const f = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Placements</h2>
          <p>{total} placement records</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Placement</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(175px,1fr))', marginBottom: 20 }}>
        {[
          { label: 'Total Placed', value: stats.total || 0, color: '#22c55e', bg: '#dcfce7', icon: Trophy },
          { label: 'Full Time', value: stats.fullTime || 0, color: '#6366f1', bg: '#e0e7ff', icon: TrendingUp },
          { label: 'Internships', value: stats.internships || 0, color: '#0ea5e9', bg: '#e0f2fe', icon: Package },
          { label: 'Avg Package', value: `${stats.packageStats?.avg?.toFixed(1) || 0} LPA`, color: '#f59e0b', bg: '#fef3c7', icon: TrendingUp },
          { label: 'Highest Package', value: `${stats.packageStats?.max || 0} LPA`, color: '#ef4444', bg: '#fee2e2', icon: Trophy },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={20} color={s.color} /></div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <div className="filters-row">
            <select className="filter-select" value={filters.type} onChange={e => f('type', e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="filter-select" value={filters.status} onChange={e => f('status', e.target.value)}>
              <option value="">All Status</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="joined">Joined</option>
              <option value="not_joined">Not Joined</option>
            </select>
            <select className="filter-select" value={filters.department} onChange={e => f('department', e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={filters.batch} onChange={e => f('batch', e.target.value)}>
              <option value="">All Batches</option>
              {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : placements.length === 0 ? (
            <div className="empty-state">
              <Trophy size={48} />
              <h3>No placements recorded yet</h3>
              <p>Add the first placement to start tracking</p>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={15} /> Add Placement</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company</th>
                  <th>Job Role</th>
                  <th>Type</th>
                  <th>Package / Stipend</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {placements.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: '#dcfce7', color: '#16a34a' }}>
                          {p.student?.name?.[0] || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.student?.name || '—'}</div>
                          <div className="text-xs text-muted">{p.student?.rollNumber} · {p.student?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.company?.name || '—'}</div>
                      <div className="text-xs text-muted">{p.company?.industry}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.jobRole}</td>
                    <td>
                      <span className={`badge ${TYPE_COLORS[p.type] || 'badge-gray'}`}>
                        {TYPE_LABELS[p.type] || p.type}
                      </span>
                    </td>
                    <td>
                      {p.type === 'internship' ? (
                        <span style={{ fontWeight: 700, color: '#0ea5e9' }}>
                          {p.stipend ? `₹${p.stipend?.toLocaleString('en-IN')}/mo` : '—'}
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 15 }}>
                          {p.package?.ctc} LPA
                        </span>
                      )}
                      {p.package?.bond > 0 && (
                        <div className="text-xs text-muted">Bond: {p.package.bond}m</div>
                      )}
                    </td>
                    <td className="text-sm">{formatDate(p.joiningDate)}</td>
                    <td>
                      <span className={`badge ${statusColors[p.status] || 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="View" onClick={() => openView(p)}><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Delete" onClick={() => openDelete(p)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && placements.length > 0 && (
          <div style={{ padding: '0 16px 8px' }}>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Edit Placement' : 'Record Placement 🎉'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : selected ? 'Update' : 'Record Placement'}
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Student *</label>
            <select className="form-control" value={form.student} onChange={e => setForm(p => ({ ...p, student: e.target.value }))}>
              <option value="">Select Student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Company *</label>
            <select className="form-control" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}>
              <option value="">Select Company</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Job Role *</label>
            <input className="form-control" value={form.jobRole} onChange={e => setForm(p => ({ ...p, jobRole: e.target.value }))} placeholder="Software Engineer" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">CTC (LPA) *</label>
            <input className="form-control" type="number" step="0.1" value={form['package.ctc']} onChange={e => setForm(p => ({ ...p, 'package.ctc': e.target.value }))} placeholder="12.5" />
          </div>
          <div className="form-group">
            <label className="form-label">In-Hand (LPA)</label>
            <input className="form-control" type="number" step="0.1" value={form['package.inHand']} onChange={e => setForm(p => ({ ...p, 'package.inHand': e.target.value }))} placeholder="9.0" />
          </div>
          <div className="form-group">
            <label className="form-label">Bond Period (months)</label>
            <input className="form-control" type="number" min="0" value={form['package.bond']} onChange={e => setForm(p => ({ ...p, 'package.bond': e.target.value }))} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Stipend (₹/month)</label>
            <input className="form-control" type="number" value={form.stipend} onChange={e => setForm(p => ({ ...p, stipend: e.target.value }))} placeholder="For internships" />
          </div>
          <div className="form-group">
            <label className="form-label">Internship Duration (months)</label>
            <input className="form-control" type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="6" />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-control" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore, Remote..." />
          </div>
          <div className="form-group">
            <label className="form-label">Offer Letter Date</label>
            <input className="form-control" type="date" value={form.offerLetterDate} onChange={e => setForm(p => ({ ...p, offerLetterDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Joining Date</label>
            <input className="form-control" type="date" value={form.joiningDate} onChange={e => setForm(p => ({ ...p, joiningDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="joined">Joined</option>
              <option value="not_joined">Not Joined</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Linked Application</label>
            <select className="form-control" value={form.application} onChange={e => setForm(p => ({ ...p, application: e.target.value }))}>
              <option value="">Select Application (optional)</option>
              {applications
                .filter(a => !form.student || (a.student?._id || a.student) === form.student)
                .map(a => (
                  <option key={a._id} value={a._id}>
                    {a.student?.name || 'Student'} @ {a.company?.name || 'Company'} — {a.jobRole}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about this placement..." />
        </div>
      </Modal>

      {/* View Modal */}
      {selected && viewModal && (
        <Modal
          open={viewModal}
          onClose={() => setViewModal(false)}
          title="Placement Details"
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewModal(false); openEdit(selected); }}>Edit</button>
            </>
          }
        >
          <div style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#166534' }}>{selected.student?.name}</h3>
                <p style={{ color: '#166534', opacity: 0.8 }}>{selected.jobRole} at {selected.company?.name}</p>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>
                    {selected.package?.ctc} LPA
                  </span>
                  {selected.package?.inHand && (
                    <span style={{ fontSize: 13, color: '#166534', opacity: 0.7, marginLeft: 8 }}>
                      ({selected.package.inHand} LPA in-hand)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="grid-3">
            {[
              ['Type', TYPE_LABELS[selected.type] || selected.type],
              ['Status', selected.status],
              ['Location', selected.location || '—'],
              ['Joining Date', formatDate(selected.joiningDate)],
              ['Offer Letter Date', formatDate(selected.offerLetterDate)],
              ['Bond Period', selected.package?.bond ? `${selected.package.bond} months` : 'None'],
              ['Stipend', selected.stipend ? `₹${selected.stipend?.toLocaleString('en-IN')}/mo` : '—'],
              ['Internship Duration', selected.duration ? `${selected.duration} months` : '—'],
              ['Student Dept.', selected.student?.department || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <div className="text-xs text-muted">{k}</div>
                <div style={{ fontWeight: 600, marginTop: 2, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          {selected.notes && (
            <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: 14 }}>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>NOTES</div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{selected.notes}</p>
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Placement"
        message={`Delete placement record for "${selected?.student?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
