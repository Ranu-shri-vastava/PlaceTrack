import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Delete', message = 'Are you sure? This action cannot be undone.', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Delete'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ background: '#fee2e2', borderRadius: 10, padding: 10, flexShrink: 0 }}>
          <AlertTriangle size={20} color="#ef4444" />
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#475569' }}>{message}</p>
      </div>
    </Modal>
  );
}
