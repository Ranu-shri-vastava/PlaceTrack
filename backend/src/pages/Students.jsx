import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../utils/api';
import { getInitials, statusColors, formatDate, DEPARTMENTS, BATCHES } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const EMPTY_FORM = {
  name: '', email: '', phone: '', rollNumber: '', department: '', batch: '',
  cgpa: '', skills: '', address: '', tenthMarks: '', twelfthMarks: '',
  backlogs: 0, isEligible: true, placementStatus: 'not_placed',
  linkedin: '', github: '', notes: ''
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ department: '', batch: '', placementStatus: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await studentAPI.getAll(params);
      setStudents(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setSelected(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s) => {
    setSelected(s);
    setForm({ ...s, skills: (s.skills || []).join(', ') });
    setModalOpen(true);
  };
  const openView = async (s) => {
    try {
      const res = await studentAPI.getOne(s._id);
      setSelected(res.data.data);
      setViewModal(true);
    } catch (e) { toast.error(e.message); }
  };
  const openDelete = (s) => { setSelected(s); setDeleteDialog(true); };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.rollNumber || !form.department || !form.batch) {
      return toast.error('Please fill required fields');
    }
    setSaving(true);
    try {
      const payload = { ...form, skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [], cgpa: Number(form.cgpa) || undefined };
      if (selected) {
        await studentAPI.update(selected._id, payload);
        toast.success('Student updated!');
      } else {
        await studentAPI.create(payload);
        toast.success('Student added!');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentAPI.delete(selected._id);
      toast.success('Student deleted');
      setDeleteDialog(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const f = (k, v) => { setFilters(prev => ({ ...prev, [k]: v })); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p>{total} students registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Student</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filters-row">
            <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
              <Search size={16} />
              <input placeholder="Search name, email, roll no..." value={filters.search}
                onChange={e => f('search', e.target.value)} />
            </div>
            <select className="filter-select" value={filters.department} onChange={e => f('department', e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={filters.batch} onChange={e => f('batch', e.target.value)}>
              <option value="">All Batches</option>
              {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="filter-select" value={filters.placementStatus} onChange={e => f('placementStatus', e.target.value)}>
              <option value="">All Status</option>
              <option value="placed">Placed</option>
              <option value="not_placed">Not Placed</option>
              <option value="internship">Internship</option>
              <option value="higher_studies">Higher Studies</option>
            </select>
            {Object.values(filters).some(Boolean) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ department: '', batch: '', placementStatus: '', search: '' }); setPage(1); }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <Users size={48} /><h3>No students found</h3>
              <p>Add your first student to get started</p>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={15} /> Add Student</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>Roll No.</th><th>Department</th>
                  <th>Batch</th><th>CGPA</th><th>Skills</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: '#e0e7ff', color: '#6366f1' }}>{getInitials(s.name)}</div>
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
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                        {(s.skills || []).slice(0, 3).map(sk => (
                          <span key={sk} className="badge badge-purple" style={{ fontSize: 10 }}>{sk}</span>
                        ))}
                        {s.skills?.length > 3 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{s.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${statusColors[s.placementStatus] || 'badge-gray'}`}>{s.placementStatus?.replace('_', ' ')}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="View" onClick={() => openView(s)}><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(s)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Delete" onClick={() => openDelete(s)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && students.length > 0 && (
          <div style={{ padding: '0 16px 8px' }}>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Student' : 'Add New Student'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : selected ? 'Update' : 'Add Student'}
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Student name" /></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="student@college.edu" /></div>
          <div className="form-group"><label className="form-label">Phone *</label><input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9999999999" /></div>
          <div className="form-group"><label className="form-label">Roll Number *</label><input className="form-control" value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="CS2021001" /></div>
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select className="form-control" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Batch *</label>
            <select className="form-control" value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}>
              <option value="">Select Batch</option>
              {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">CGPA</label><input className="form-control" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => setForm(p => ({ ...p, cgpa: e.target.value }))} placeholder="8.5" /></div>
          <div className="form-group"><label className="form-label">Backlogs</label><input className="form-control" type="number" min="0" value={form.backlogs} onChange={e => setForm(p => ({ ...p, backlogs: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">10th Marks (%)</label><input className="form-control" type="number" value={form.tenthMarks} onChange={e => setForm(p => ({ ...p, tenthMarks: e.target.value }))} placeholder="85" /></div>
          <div className="form-group"><label className="form-label">12th Marks (%)</label><input className="form-control" type="number" value={form.twelfthMarks} onChange={e => setForm(p => ({ ...p, twelfthMarks: e.target.value }))} placeholder="82" /></div>
          <div className="form-group"><label className="form-label">LinkedIn</label><input className="form-control" value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." /></div>
          <div className="form-group"><label className="form-label">GitHub</label><input className="form-control" value={form.github} onChange={e => setForm(p => ({ ...p, github: e.target.value }))} placeholder="https://github.com/..." /></div>
        </div>
        <div className="form-group"><label className="form-label">Skills (comma separated)</label><input className="form-control" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="React, Node.js, Python, SQL" /></div>
        <div className="form-group"><label className="form-label">Placement Status</label>
          <select className="form-control" value={form.placementStatus} onChange={e => setForm(p => ({ ...p, placementStatus: e.target.value }))}>
            <option value="not_placed">Not Placed</option>
            <option value="placed">Placed</option>
            <option value="internship">Internship</option>
            <option value="higher_studies">Higher Studies</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="eligible" checked={form.isEligible} onChange={e => setForm(p => ({ ...p, isEligible: e.target.checked }))} style={{ width: 'auto' }} />
          <label htmlFor="eligible" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Eligible for placements</label>
        </div>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Student Profile" size="lg"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
            <button className="btn btn-primary" onClick={() => { setViewModal(false); openEdit(selected); }}>Edit</button>
          </>}
        >
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'center' }}>
            <div className="avatar avatar-lg" style={{ width: 64, height: 64, fontSize: 24, background: '#e0e7ff', color: '#6366f1' }}>{getInitials(selected.name)}</div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</h3>
              <p className="text-muted">{selected.email} · {selected.phone}</p>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${statusColors[selected.placementStatus] || 'badge-gray'}`}>{selected.placementStatus?.replace('_', ' ')}</span>
                {!selected.isEligible && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Ineligible</span>}
              </div>
            </div>
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            {[
              ['Roll No.', selected.rollNumber], ['Department', selected.department],
              ['Batch', selected.batch], ['CGPA', selected.cgpa],
              ['10th', selected.tenthMarks ? `${selected.tenthMarks}%` : '—'],
              ['12th', selected.twelfthMarks ? `${selected.twelfthMarks}%` : '—'],
              ['Backlogs', selected.backlogs ?? '—'], ['Added', formatDate(selected.createdAt)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <div className="text-xs text-muted">{k}</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          {selected.skills?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="text-xs text-muted" style={{ marginBottom: 6 }}>SKILLS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.skills.map(s => <span key={s} className="badge badge-purple">{s}</span>)}
              </div>
            </div>
          )}
          {selected.applications?.length > 0 && (
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 8 }}>APPLICATIONS ({selected.applications.length})</div>
              {selected.applications.slice(0, 3).map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{a.company?.name}</span>
                  <span className={`badge ${statusColors[a.status] || 'badge-gray'}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Student"
        message={`Are you sure you want to delete "${selected?.name}"? All related applications and placements will also be deleted.`}
      />
    </div>
  );
}
