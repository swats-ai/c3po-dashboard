export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z')).getTime();
  const diff = now - then;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function elapsed(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z')).getTime();
  const diff = now - then;
  if (diff < 0) return '0m';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export function statusClass(status: string): string {
  switch (status) {
    case 'InProgress': case 'Queued': return 's-active';
    case 'Completed': case 'Deployed': case 'Finished': return 's-completed';
    case 'Received': case 'Pending': return 's-standby';
    case 'Failed': case 'Escalated': case 'Rejected': return 's-failed';
    default: return '';
  }
}

export function rowClass(status: string): string {
  return statusClass(status).replace('s-', 'r-');
}

export function badgeClass(status: string): string {
  switch (status) {
    case 'InProgress': return 'badge-active';
    case 'Queued': return 'badge-queued';
    case 'Completed': return 'badge-completed';
    case 'Finished': return 'badge-finished';
    case 'Deployed': return 'badge-deployed';
    case 'Failed': return 'badge-failed';
    case 'Escalated': return 'badge-escalated';
    case 'Rejected': return 'badge-rejected';
    case 'Received': return 'badge-received';
    default: return '';
  }
}

export function truncate(s: string, n: number): string {
  return s && s.length > n ? s.substring(0, n) + '…' : (s || '');
}
