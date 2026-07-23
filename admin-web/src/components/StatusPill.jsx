import React from 'react';

const LABEL = {
  pending: 'Pending', approved: 'Approved', completed: 'Completed',
  rejected: 'Rejected', cancelled: 'Cancelled',
};
const COLOR = {
  pending: '#c9870a', approved: '#1b7a3c', completed: '#0f5c2a',
  rejected: '#c6432b', cancelled: '#6b7267',
};

export default function StatusPill({ status }) {
  const color = COLOR[status] || '#6b7267';
  return (
    <span className="pill" style={{ background: `${color}22`, color }}>
      {LABEL[status] || status}
    </span>
  );
}
