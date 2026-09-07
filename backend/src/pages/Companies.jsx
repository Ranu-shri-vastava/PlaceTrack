import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyAPI } from '../utils/api';
import { statusColors, formatDate, INDUSTRIES } from '../utils/helpers';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const EMPTY = {
  name: '', email: '', phone: '', website: '', industry: '', description: '',
  hrName: '', hrEmail: '', hrPhone: '', location: '', type: 'product',
  'eligibilityCriteria.minCGPA': '', 'eligibilityCriteria.maxBacklogs': '',
  'eligibilityCriteria.departments': [], 'eligibilityCriteria.batch': [],
  'packageOffered.min': '', 'packageOffered.max': '',
  jobRoles: '', visitDate: '', status: 'upcoming', notes: ''
};

const TYPE_LABELS = { product: 'Product', service: 'Service', startup: 'Startup', mnc: 'MNC', psu: 'PSU', other: 'Other' };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ industry: '', type: '', status: '', search: '' });
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
      const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await companyAPI.getAll(params);
      setCompanies(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setSelected(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c) => {
    setSelected(c);
    setForm({
      ...EMPTY, ...c,
      'eligibilityCriteria.minCGPA': c.eligibilityCriteria?.minCGPA || '',
      'eligibilityCriteria.maxBacklogs': c.eligibilityCriteria?.maxBacklogs || '',
      'packageOffered.min': c.packageOffered?.min || '',
      'packageOffered.max': c.packageOffered?.max || '',
      jobRoles: (c.jobRoles || []).join(', '),
      visitDate: c.visitDate ? c.visitDate.slice(0, 10) : '',
    });
    setModalOpen(true);
  };
  const openView = async (c) => {
    try { const res = await companyAPI.getOne(c._id); setSelected(res.data.data); setViewModal(true); }
    catch (e) { toast.error(e.message); }
  };
  const openDelete = (c) => { setSelected(c); setDeleteDialog(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Company name is required');
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone, website: form.website,
        industry: form.industry, description: form.description, hrName: form.hrName,
        hrEmail: form.hrEmail, hrPhone: form.hrPhone, location: form.location,
        type: form.type, status: form.status, notes: form.notes,
        visitDate: form.visitDate || undefined,
        jobRoles: form.jobRoles ? form.jobRoles.split(',').map(r => r.trim()).filter(Boolean) : [],
        eligibilityCriteria: {
          minCGPA: Number(form['eligibilityCriteria.minCGPA']) || 0,
          maxBacklogs: Number(form['eligibilityCriteria.maxBacklogs']) || 0,
        },
        packageOffered: {
          min: Number(form['packageOffered.min']) || undefined,
          max: Number(form['packageOffered.max']) || undefined,
        }
      };
      if (selected) { await companyAPI.update(selected._id, payload); toast.success('Company updated!'); }
      else { await companyAPI.create(payload); toast.success('Company added!'); }
      setModalOpen(false); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await companyAPI.delete(selected._id); toast.success('Company deleted'); setDeleteDialog(false); load(); }
    catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const f = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const statusBadge = { upcoming: 'badge-info', active: 'badge-success', completed: 'badge-gray', cancelled: 'badge-danger' };

  return (
    <div>
      <div className="page-header">
        <div><h2>Companies</h2><p>{total} companies registered</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Company</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filters-row">
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} />
              <input placeholder="Search company, industry..." value={filters.search} onChange={e => f('search', e.target.value)} />
            </div>
            <select className="filter-select" value={filters.industry} onChange={e => f('industry', e.target.value)}>
              <option value="">All Industries</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select className="filter-select" value={filters.type} onChange={e => f('type', e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="filter-select" value={filters.status} onChange={e => f('status', e.target.value)}>
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company cards grid */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : companies.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <Building2 size={48} /><h3>No companies found</h3>
          <p>Add your first company to start tracking placements</p>
          <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={15} /> Add Company</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
            {companies.map(c => (
              <div key={c._id} className="card" style={{ transition: 'transform .2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="avatar avatar-lg" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 18, fontWeight: 700 }}>
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                        <div className="text-xs text-muted">{c.industry}</div>
                      </div>
                    </div>
                    <span className={`badge ${statusBadge[c.status] || 'badge-gray'}`}>{c.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className={`badge badge-purple`}>{TYPE_LABELS[c.type] || c.type}</span>
                    {c.location && <span className="badge badge-gray">📍 {c.location}</span>}
                  </div>
                  {(c.packageOffered?.min || c.packageOffered?.max) && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>
                        💰 Package: {c.packageOffered?.min || '?'} – {c.packageOffered?.max || '?'} LPA
                      </span>
                    </div>
                  )}
                  {c.jobRoles?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.jobRoles.slice(0, 3).map(r => <span key={r} className="badge badge-info" style={{ fontSize: 10 }}>{r}</span>)}
                        {c.jobRoles.length > 3 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{c.jobRoles.length - 3}</span>}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openView(c)}><Eye size={13} /> View</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit2 size={13} /> Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => openDelete(c)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Company' : 'Add New Company'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : selected ? 'Update' : 'Add Company'}
          </button>
        </>}
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Company Name *</label><input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Google, Microsoft..." /></div>
          <div className="form-group"><label className="form-label">Industry</label>
            <select className="form-control" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}>
              <option value="">Select Industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Website</label><input className="form-control" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://company.com" /></div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-control" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Bangalore, Remote..." /></div>
          <div className="form-group"><label className="form-label">HR Name</label><input className="form-control" value={form.hrName} onChange={e => setForm(p => ({ ...p, hrName: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">HR Email</label><input className="form-control" type="email" value={form.hrEmail} onChange={e => setForm(p => ({ ...p, hrEmail: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Min Package (LPA)</label><input className="form-control" type="number" value={form['packageOffered.min']} onChange={e => setForm(p => ({ ...p, 'packageOffered.min': e.target.value }))} placeholder="5" /></div>
          <div className="form-group"><label className="form-label">Max Package (LPA)</label><input className="form-control" type="number" value={form['packageOffered.max']} onChange={e => setForm(p => ({ ...p, 'packageOffered.max': e.target.value }))} placeholder="15" /></div>
          <div className="form-group"><label className="form-label">Min CGPA Required</label><input className="form-control" type="number" step="0.1" value={form['eligibilityCriteria.minCGPA']} onChange={e => setForm(p => ({ ...p, 'eligibilityCriteria.minCGPA': e.target.value }))} placeholder="6.5" /></div>
          <div className="form-group"><label className="form-label">Max Backlogs Allowed</label><input className="form-control" type="number" value={form['eligibilityCriteria.maxBacklogs']} onChange={e => setForm(p => ({ ...p, 'eligibilityCriteria.maxBacklogs': e.target.value }))} placeholder="0" /></div>
          <div className="form-group"><label className="form-label">Visit Date</label><input className="form-control" type="date" value={form.visitDate} onChange={e => setForm(p => ({ ...p, visitDate: e.target.value }))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Job Roles (comma separated)</label><input className="form-control" value={form.jobRoles} onChange={e => setForm(p => ({ ...p, jobRoles: e.target.value }))} placeholder="Software Engineer, Data Analyst, Product Manager" /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Company Details" size="lg"
          footer={<>
            <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
            <button className="btn btn-primary" onClick={() => { setViewModal(false); openEdit(selected); }}>Edit</button>
          </>}
        >
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
            <div className="avatar avatar-lg" style={{ width: 60, height: 60, fontSize: 22, background: '#ede9fe', color: '#7c3aed' }}>{selected.name?.[0]}</div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</h3>
              <p className="text-muted">{selected.industry} · {selected.location}</p>
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <span className={`badge ${statusBadge[selected.status] || 'badge-gray'}`}>{selected.status}</span>
                <span className="badge badge-purple">{TYPE_LABELS[selected.type]}</span>
              </div>
            </div>
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            {[
              ['Package', selected.packageOffered ? `${selected.packageOffered.min || '?'}–${selected.packageOffered.max || '?'} LPA` : '—'],
              ['Min CGPA', selected.eligibilityCriteria?.minCGPA || '0'],
              ['Max Backlogs', selected.eligibilityCriteria?.maxBacklogs ?? '0'],
              ['HR Name', selected.hrName || '—'], ['HR Email', selected.hrEmail || '—'],
              ['Visit Date', formatDate(selected.visitDate)],
              ['Total Applicants', selected.stats?.totalApplicants ?? '—'],
              ['Selected', selected.stats?.selected ?? '—'],
              ['Placed', selected.stats?.placed ?? '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <div className="text-xs text-muted">{k}</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          {selected.jobRoles?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="text-xs text-muted" style={{ marginBottom: 6 }}>JOB ROLES</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.jobRoles.map(r => <span key={r} className="badge badge-info">{r}</span>)}
              </div>
            </div>
          )}
          {selected.description && <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{selected.description}</p>}
        </Modal>
      )}

      <ConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} loading={deleting}
        title="Delete Company" message={`Delete "${selected?.name}"? This action cannot be undone.`} />
    </div>
  );
}
