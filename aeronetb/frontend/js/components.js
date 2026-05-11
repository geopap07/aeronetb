// Shared UI helpers

function statusBadge(status) {
  const map = {
    placed: 'badge-gray', confirmed: 'badge-blue', dispatched: 'badge-blue',
    delivered: 'badge-green', completed: 'badge-green', cancelled: 'badge-red',
    in_transit: 'badge-blue', pending: 'badge-gray', arrived: 'badge-green',
    cleared: 'badge-green', pass: 'badge-green', fail: 'badge-red',
    operational: 'badge-green', warning: 'badge-amber', critical: 'badge-red',
    running: 'badge-green', 'in_progress': 'badge-blue'
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}

function fmtDate(d) {
  if (!d) return '<span class="text-muted">—</span>';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtMoney(n) {
  if (n == null) return '—';
  return '$' + parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function isOverdue(desired) {
  if (!desired) return false;
  return new Date(desired) < new Date();
}

function showModal(html) {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal">${html}</div>`;
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
  return ov;
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:0.75rem 1rem;
    background:${type==='error'?'var(--red-bg)':'var(--green-bg)'};
    color:${type==='error'?'var(--red)':'var(--green)'};
    border:1px solid ${type==='error'?'var(--red)':'var(--green)'};
    border-radius:8px;font-size:0.875rem;z-index:999;max-width:320px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function renderPage(html) {
  document.getElementById('page-container').innerHTML = html;
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// Simple inline bar chart using divs
function miniBar(value, max, color = 'var(--blue)') {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return `<div style="height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;width:80px;display:inline-block;vertical-align:middle;">
    <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;"></div>
  </div> <span style="font-size:0.75rem;color:var(--text2)">${pct}%</span>`;
}
