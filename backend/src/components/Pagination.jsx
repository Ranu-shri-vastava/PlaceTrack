import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', fontSize: 13 }}>
      <span className="text-muted">Showing page {page} of {pages} ({total} total)</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page - 2 + i;
          if (p < 1 || p > pages) return null;
          return (
            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onPage(p)}>
              {p}
            </button>
          );
        })}
        <button className="btn btn-secondary btn-sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
