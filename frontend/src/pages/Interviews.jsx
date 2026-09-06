import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Plus, Edit2, Trash2, Eye, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI, studentAPI, companyAPI, applicationAPI } from '../utils/api';
import { statusColors, formatDate, formatDateTime, INTERVIEW_ROUNDS } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const EMPTY = {
  student: '', company: '', application: '',
  round: 1, roundName: 'technical_1',
  scheduledDate: '', scheduledTime: '',
  mode: 'offline', venue: '', meetingLink: '',
  interviewerName: '', interviewerEmail: '',
  status: 'scheduled', result: 'pending',
  feedback: '', score: '', notes: '',
};

const RESULT_COLORS = { pass: 'badge-success', fail: 'badge-danger', pending: 'badge-warning', hold: 'badge-orange' };
const MODE_LABELS = { online: '🌐 Online', offline: '🏢 Offline', hybrid: '🔀 Hybrid' };
const ROUND_LABELS = {
  aptitude: 'Aptitude', technical_1: 'Technical 1', technical_2: 'Technical 2',
  hr: 'HR', gd: 'Group Discussion', case_study: 'Case Study', final: 'Final', other: 'Other'
};

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [tab, setTab] = useState('all'); // 'all' | 'upcoming'
  const [filters, setFilters] = useState({ status: '', result: '', search: '' });
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
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const [intRes, upRes, stRes] = await Promise.all([
        interviewAPI.getAll(params),
        interviewAPI.upcoming(),
        interviewAPI.stats(),
      ]);
      setInterviews(intRes.data.data);
      setTotal(intRes.data.total);
      setPages(intRes.data.pages);
      setUpcoming(upRes.data.data);
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
  const openEdit = (i) => {
    setSelected(i);
    setForm({
      ...EMPTY, ...i,
      student: i.student?._id || i.student || '',
      company: i.company?._id || i.company || '',
      application: i.application?._id || i.application || '',
      scheduledDate: i.scheduledDate ? i.scheduledDate.slice(0, 10) : '',
      score: i.score || '',
    });
    setModalOpen(true);
  };
  const openView = (i) => { setSelected(i); setViewModal(true); };
  const openDelete = (i) => { setSelected(i); setDeleteDialog(true); };

  const handleSave = async () => {
    if (!form.student || !form.company || !form.scheduledDate) {
      return toast.error('Student, Company and Date are required');
    }
    setSaving(true);
    try {
      const payload = { ...form, score: form.score ? Number(form.score) : undefined };
      if (selected) {
        await interviewAPI.update(selected._id, payload);
        toast.success('Interview updated!');
      } else {
        await interviewAPI.create(payload);
        toast.success('Interview scheduled!');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await interviewAPI.delete(selected._id);
      toast.success('Interview deleted');
      setDeleteDialog(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const f = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const displayList = tab === 'upcoming' ? upcoming : interviews;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Interviews</h2>
          <p>{total} total interviews · {upcoming.length} upcoming</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Schedule Interview</button>
      </div>

      {/* Stats row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total || 0, color: '#6366f1', bg: '#e0e7ff', icon: CalendarCheck },
          { label: 'Scheduled', value: stats.scheduled || 0, color: '#0ea5e9', bg: '#e0f2fe', icon: Clock },
          { label: 'Completed', value: stats.completed || 0, color: '#22c55e', bg: '#dcfce7', icon: CheckCircle },
          { label: 'Pass Rate', value: `${stats.passRate || 0}%`, color: '#f59e0b', bg: '#fef3c7', icon: CheckCircle },
          { label: 'Failed', value: stats.failed || 0, color: '#ef4444', bg: '#fee2e2', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={20} color={s.color} /></div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Interviews</div>
        <div className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming (Next 7 Days)
          {upcoming.length > 0 && <span className="nav-badge" style={{ marginLeft: 6, background: '#ef4444' }}>{upcoming.length}</span>}
        </div>
      </div>

      {/* Filters (only for all tab) */}
      {tab === 'all' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            <div className="filters-row">
              <div className="search-bar" style={{ flex: 1 }}>
                <Search size={16} />
                <input placeholder="Search student, company..." value={filters.search} onChange={e => f('search', e.target.value)} />
              </div>
              <select className="filter-select" value={filters.status} onChange={e => f('status', e.target.value)}>
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="no_show">No Show</option>
              </select>
              <select className="filter-select" value={filters.result} onChange={e => f('result', e.target.value)}>
                <option value="">All Results</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="pending">Pending</option>
                <option value="hold">Hold</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : displayList.length === 0 ? (
            <div className="empty-state">
              <CalendarCheck size={48} />
              <h3>{tab === 'upcoming' ? 'No upcoming interviews in next 7 days' : 'No interviews found'}</h3>
              <p>Schedule your first interview to get started</p>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={15} /> Schedule Interview</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company</th>
                  <th>Round</th>
                  <th>Date & Time</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(iv => (
                  <tr key={iv._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: '#e0e7ff', color: '#6366f1' }}>
                          {iv.student?.name?.[0] || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{iv.student?.name || '—'}</div>
                          <div className="text-xs text-muted">{iv.student?.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{iv.company?.name || '—'}</div>
                      <div className="text-xs text-muted">{iv.application?.jobRole}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: 11 }}>
                        R{iv.round} · {ROUND_LABELS[iv.roundName] || iv.roundName}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatDate(iv.scheduledDate)}</div>
                      <div className="text-xs text-muted">{iv.scheduledTime || '—'}</div>
                    </td>
                    <td className="text-sm">{MODE_LABELS[iv.mode] || iv.mode}</td>
                    <td>
                      <span className={`badge ${statusColors[iv.status] || 'badge-gray'}`}>
                        {iv.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${RESULT_COLORS[iv.result] || 'badge-gray'}`}>
                        {iv.result}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="View" onClick={() => openView(iv)}><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(iv)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Delete" onClick={() => openDelete(iv)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && tab === 'all' && interviews.length > 0 && (
          <div style={{ padding: '0 16px 8px' }}>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Edit Interview' : 'Schedule Interview'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : selected ? 'Update' : 'Schedule'}
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
          <div className="form-group">
            <label className="form-label">Round Name</label>
            <select className="form-control" value={form.roundName} onChange={e => setForm(p => ({ ...p, roundName: e.target.value }))}>
              {INTERVIEW_ROUNDS.map(r => <option key={r} value={r}>{ROUND_LABELS[r] || r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Round Number</label>
            <input className="form-control" type="number" min="1" value={form.round} onChange={e => setForm(p => ({ ...p, round: Number(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select className="form-control" value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-control" type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-control" type="time" value={form.scheduledTime} onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Venue / Location</label>
            <input className="form-control" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="Room 101 / Online" />
          </div>
          <div className="form-group">
            <label className="form-label">Meeting Link</label>
            <input className="form-control" value={form.meetingLink} onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Interviewer Name</label>
            <input className="form-control" value={form.interviewerName} onChange={e => setForm(p => ({ ...p, interviewerName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Interviewer Email</label>
            <input className="form-control" type="email" value={form.interviewerEmail} onChange={e => setForm(p => ({ ...p, interviewerEmail: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Result</label>
            <select className="form-control" value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="hold">Hold</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Score</label>
            <input className="form-control" type="number" min="0" max="100" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} placeholder="75" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Feedback</label>
          <textarea className="form-control" rows={2} value={form.feedback} onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))} placeholder="Interview feedback..." />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." />
        </div>
      </Modal>

      {/* View Modal */}
      {selected && viewModal && (
        <Modal
          open={viewModal}
          onClose={() => setViewModal(false)}
          title="Interview Details"
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewModal(false); openEdit(selected); }}>Edit</button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
            <div className="avatar avatar-lg" style={{ width: 56, height: 56, fontSize: 20, background: '#e0e7ff', color: '#6366f1' }}>
              {selected.student?.name?.[0] || '?'}
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{selected.student?.name || '—'}</h3>
              <p className="text-muted">{selected.company?.name} · {ROUND_LABELS[selected.roundName]} (Round {selected.round})</p>
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <span className={`badge ${statusColors[selected.status] || 'badge-gray'}`}>{selected.status}</span>
                <span className={`badge ${RESULT_COLORS[selected.result] || 'badge-gray'}`}>{selected.result}</span>
                {selected.score != null && <span className="badge badge-info">Score: {selected.score}</span>}
              </div>
            </div>
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            {[
              ['Date', formatDate(selected.scheduledDate)],
              ['Time', selected.scheduledTime || '—'],
              ['Mode', MODE_LABELS[selected.mode] || selected.mode],
              ['Venue', selected.venue || '—'],
              ['Interviewer', selected.interviewerName || '—'],
              ['Interviewer Email', selected.interviewerEmail || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <div className="text-xs text-muted">{k}</div>
                <div style={{ fontWeight: 600, marginTop: 2, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          {selected.meetingLink && (
            <div style={{ marginBottom: 12 }}>
              <a href={selected.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                🔗 Join Meeting
              </a>
            </div>
          )}
          {selected.feedback && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div className="text-xs text-muted" style={{ marginBottom: 4 }}>FEEDBACK</div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{selected.feedback}</p>
            </div>
          )}
          {selected.notes && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14 }}>
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
        title="Delete Interview"
        message="Delete this interview record? This action cannot be undone."
      />
    </div>
  );
}
