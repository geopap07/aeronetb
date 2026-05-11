// Auditor / Regulator — read-only compliance view

async function renderAuditorHome() {
  setActiveNav('nav-aud-home');
  renderPage('<div class="loading">Loading compliance records...</div>');
  try {
    const [certs, auditLog, reports] = await Promise.all([
      api.getCertifications(), api.getAuditLog(), api.getQCReports()
    ]);
    const locked = certs.filter(c => c.is_immutable);
    const html = `
      <div class="page-header">
        <div><h2>Compliance & Audit View</h2>
          <p>Read-only access — all records are immutable once approved</p>
        </div>
        <div class="header-actions">
          <button class="btn-ghost btn-sm" onclick="exportAuditLog()">↓ Export Audit Log</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card green"><div class="stat-label">Locked Certs</div><div class="stat-value">${locked.length}</div></div>
        <div class="stat-card amber"><div class="stat-label">Draft Certs</div><div class="stat-value">${certs.length - locked.length}</div></div>
        <div class="stat-card blue"><div class="stat-label">QC Reports</div><div class="stat-value">${reports.length}</div></div>
        <div class="stat-card blue"><div class="stat-label">Audit Entries</div><div class="stat-value">${auditLog.length}</div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>Component Certifications</span>
          <span class="badge badge-blue">Read-only</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Doc Ref</th><th>Serial No.</th><th>Part</th><th>Inspector</th><th>Approved</th><th>Status</th></tr></thead>
            <tbody>
              ${certs.map(c => `
                <tr>
                  <td class="mono">${c.doc_ref}</td>
                  <td class="mono">${c.serial_number}</td>
                  <td>${c.part_name}</td>
                  <td>${c.inspector_name}</td>
                  <td>${fmtDateTime(c.approved_at)}</td>
                  <td>${c.is_immutable
                    ? '<span class="badge badge-green">🔒 Locked</span>'
                    : '<span class="badge badge-amber">Draft</span>'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>QC Reports — Version History</span>
          <span class="badge badge-blue">Read-only</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Report ID</th><th>Item Serial</th><th>Type</th><th>Status</th><th>Versions</th><th>Part</th><th>Supplier</th></tr></thead>
            <tbody>
              ${reports.map(r => `
                <tr>
                  <td class="mono">${r.report_id}</td>
                  <td class="mono">${r.delivered_item_serial}</td>
                  <td><span class="badge badge-gray">${r.report_type}</span></td>
                  <td>${statusBadge(r.overall_status)}</td>
                  <td class="mono">${r.versions?.length || 0}</td>
                  <td>${r.part_name||'—'}</td>
                  <td>${r.supplier_name||'—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>Audit Log</span>
          <span class="badge badge-blue">Read-only</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Table</th><th>Record</th><th>Description</th></tr></thead>
            <tbody>
              ${auditLog.map(l => `
                <tr>
                  <td class="mono" style="font-size:0.78rem">${fmtDateTime(l.logged_at)}</td>
                  <td>${l.full_name||'System'}</td>
                  <td>${l.role ? `<span class="badge badge-gray">${l.role}</span>` : '—'}</td>
                  <td><span class="badge ${l.action==='INSERT'?'badge-green':l.action==='UPDATE'?'badge-blue':l.action==='APPROVE'?'badge-purple':'badge-gray'}">${l.action}</span></td>
                  <td class="mono">${l.table_name||'—'}</td>
                  <td class="mono">${l.record_id||'—'}</td>
                  <td style="font-size:0.82rem;color:var(--text2)">${l.description||'—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    renderPage(html);
    window._auditData = auditLog;
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}

function exportAuditLog() {
  const data = window._auditData || [];
  const csv = ['Timestamp,User,Role,Action,Table,Record,Description',
    ...data.map(l => [
      l.logged_at, l.full_name||'', l.role||'',
      l.action, l.table_name||'', l.record_id||'',
      `"${(l.description||'').replace(/"/g,'""')}"`
    ].join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `aeronetb_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
