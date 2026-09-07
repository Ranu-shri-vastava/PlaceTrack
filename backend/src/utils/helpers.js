export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const statusColors = {
  applied:        'badge-info',
  shortlisted:    'badge-purple',
  interview:      'badge-warning',
  selected:       'badge-success',
  rejected:       'badge-danger',
  offer_accepted: 'badge-success',
  offer_declined: 'badge-gray',
  not_placed:     'badge-gray',
  placed:         'badge-success',
  internship:     'badge-info',
  higher_studies: 'badge-purple',
  scheduled:      'badge-info',
  completed:      'badge-success',
  cancelled:      'badge-danger',
  rescheduled:    'badge-warning',
  no_show:        'badge-danger',
  pass:           'badge-success',
  fail:           'badge-danger',
  pending:        'badge-warning',
  hold:           'badge-orange',
  upcoming:       'badge-info',
  active:         'badge-success',
  product:        'badge-purple',
  service:        'badge-info',
  startup:        'badge-warning',
  mnc:            'badge-success',
  offered:        'badge-info',
  accepted:       'badge-success',
  declined:       'badge-danger',
  joined:         'badge-success',
};

export const pipelineStageColors = {
  applied:     { bg: '#6366f1', light: '#e0e7ff' },
  shortlisted: { bg: '#0ea5e9', light: '#e0f2fe' },
  interview:   { bg: '#f59e0b', light: '#fef3c7' },
  selected:    { bg: '#22c55e', light: '#dcfce7' },
  rejected:    { bg: '#ef4444', light: '#fee2e2' },
};

export const formatPackage = (ctc) => {
  if (!ctc) return '—';
  return `${ctc} LPA`;
};

export const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'MBA', 'MCA', 'Other'];
export const BATCHES = ['2024', '2025', '2026', '2027', '2028'];
export const INDUSTRIES = ['IT/Software', 'Finance', 'Consulting', 'Manufacturing', 'Healthcare', 'E-commerce', 'Telecom', 'FMCG', 'Other'];
export const COMPANY_TYPES = ['product', 'service', 'startup', 'mnc', 'psu', 'other'];
export const INTERVIEW_ROUNDS = ['aptitude', 'technical_1', 'technical_2', 'hr', 'gd', 'case_study', 'final', 'other'];
