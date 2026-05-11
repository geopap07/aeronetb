// Quality Inspector dashboard pages

async function renderInspectorHome() {
  setActiveNav('nav-insp-home');
  renderPage('<div class="loading">Loading...</div>');
  try {
    const [reports, certs] = await Promise.all([api.getQCReports(), api.getCertifications()]);
    const pending = reports.filter(r => r.overall_status === 'pending');
    const failed  = reports.filter(r => r.overall_status === 'fail');
    const passed  = reports.filter(r => r.overall_status === 'pass');
    const html = `
      <div class="page-header">
        <div><h2>Quality Control</h2><p>Inspections, QC reports, and certifications</p></div>
        <div class="header-actions">
          <button class="btn-primary btn-sm" onclick="renderCreateQCReport()">+ New QC Report</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card amber"><div class="stat-label">Pending</div><div class="stat-value">${pending.length}</div></div>
        <div class="stat-card green"><div class="stat-label">Passed</div><div class="stat-value">${passed.length}</div></div>
        <div class="stat-card red"><div class="stat-label">Failed</div><div class="stat-value">${failed.length}</div></div>
        <div class="stat-card blue"><div class="stat-label">Certifications</div><div class="stat-value">${certs.length}</div></div>
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-header"><span>QC Reports</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Report ID</th><th>Item Serial</th><th>Type</th><th>Status</th><th>Versions</th><th></th></tr></thead>
              <tbody>
                ${reports.map(r => `
                  <tr>
                    <td class="mono">${r.report_id}</td>
                    <td class="mono">${r.delivered_item_serial}</td>
                    <td><span class="badge badge-gray">${r.report_type}</span></td>
                    <td>${statusBadge(r.overall_status)}</td>
                    <td class="mono">${r.versions?.length || 0}</td>
                    <td>
                      ${r.overall_status !== 'pass' ? `<button class="btn-ghost btn-sm" onclick="renderQCReportDetail('${r.report_id}')">Edit</button>` : ''}
                      <button class="btn-ghost btn-sm" onclick="renderQCReportDetail('${r.report_id}')">View</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span>Certifications</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Cert Ref</th><th>Serial</th><th>Inspector</th><th>Locked</th><th></th></tr></thead>
              <tbody>
                ${certs.map(c => `
                  <tr>
                    <td class="mono">${c.doc_ref}</td>
                    <td class="mono">${c.serial_number}</td>
                    <td>${c.inspector_name}</td>
                    <td>${c.is_immutable ? '<span class="badge badge-green lock-icon">Locked</span>' : '<span class="badge badge-amber">Draft</span>'}</td>
                    <td>${!c.is_immutable ? `<button class="btn-primary btn-sm" onclick="approveCert(${c.cert_id})">Approve & Lock</button>` : ''}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
    renderPage(html);
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}

async function renderCreateQCReport() {
  setActiveNav('nav-insp-new');
  renderPage(`
    <div class="page-header">
      <div><h2>New QC Report</h2></div>
      <div class="header-actions"><button class="btn-ghost btn-sm" onclick="renderInspectorHome()">← Back</button></div>
    </div>
    <div class="card"><div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Item Serial Number</label>
          <input type="text" id="qc-serial" placeholder="FP-A320-2025-001">
        </div>
        <div class="form-group">
          <label>Report Type</label>
          <select id="qc-type">
            <option value="dimensional">Dimensional Check</option>
            <option value="ndt">NDT (Non-Destructive Test)</option>
            <option value="visual">Visual Inspection</option>
            <option value="environmental">Environmental Stress Test</option>
          </select>
        </div>
        <div class="form-group">
          <label>Part Name</label>
          <input type="text" id="qc-part" placeholder="A320 Fuselage Panel">
        </div>
        <div class="form-group">
          <label>Supplier Name</label>
          <input type="text" id="qc-supplier" placeholder="AeroFrame Technologies Ltd">
        </div>
        <div class="form-group span2">
          <label>Inspector Notes</label>
          <textarea id="qc-notes" placeholder="Describe inspection findings..."></textarea>
        </div>
        <div class="form-group">
          <label>Overall Result</label>
          <select id="qc-result">
            <option value="pending">Pending</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="renderInspectorHome()">Cancel</button>
        <button class="btn-primary" onclick="submitQCReport()">Submit QC Report</button>
      </div>
    </div></div>`);
}

async function submitQCReport() {
  const payload = {
    delivered_item_serial: document.getElementById('qc-serial').value,
    report_type:           document.getElementById('qc-type').value,
    part_name:             document.getElementById('qc-part').value,
    supplier_name:         document.getElementById('qc-supplier').value,
    inspector_notes:       document.getElementById('qc-notes').value,
    overall_status:        document.getElementById('qc-result').value
  };
  if (!payload.delivered_item_serial) return showToast('Serial number required', 'error');
  try {
    await api.createQCReport(payload);
    showToast('QC Report submitted successfully!');
    renderInspectorHome();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function renderQCReportDetail(reportId) {
  try {
    const r = await api.getQCReport(reportId);
    const html = `
      <div class="page-header">
        <div><h2>${r.report_id}</h2><p>${r.part_name} — ${r.supplier_name}</p></div>
        <div class="header-actions">
          ${r.overall_status !== 'pass' ? `<button class="btn-primary btn-sm" onclick="showAddVersionModal('${r.report_id}')">+ Add Version</button>` : ''}
          <button class="btn-ghost btn-sm" onclick="renderInspectorHome()">← Back</button>
        </div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-body">
          <table style="width:100%">
            <tr><td class="text-muted">Report ID</td><td class="mono">${r.report_id}</td></tr>
            <tr><td class="text-muted">Item Serial</td><td class="mono">${r.delivered_item_serial}</td></tr>
            <tr><td class="text-muted">Type</td><td>${r.report_type}</td></tr>
            <tr><td class="text-muted">Status</td><td>${statusBadge(r.overall_status)}</td></tr>
            <tr><td class="text-muted">Inspector</td><td>${r.created_by_name}</td></tr>
            <tr><td class="text-muted">Created</td><td>${fmtDateTime(r.created_at)}</td></tr>
            <tr><td class="text-muted">Versions</td><td class="mono">${r.versions?.length || 0}</td></tr>
          </table>
        </div></div>
        <div class="card"><div class="card-header">Version History</div>
          <div style="padding:1rem">
            ${(r.versions || []).map(v => `
              <div style="border:1px solid var(--border);border-radius:6px;padding:0.75rem;margin-bottom:0.75rem">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <strong>Version ${v.version}</strong>
                  <span class="text-muted" style="font-size:0.8rem">${fmtDateTime(v.created_at)}</span>
                </div>
                <p style="font-size:0.85rem;color:var(--text2)">${v.inspector_notes}</p>
                ${v.overall_result ? `<div style="margin-top:6px">${statusBadge(v.overall_result)}</div>` : ''}
              </div>`).join('')}
          </div>
        </div>
      </div>`;
    renderPage(html);
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}

function showAddVersionModal(reportId) {
  showModal(`
    <div class="modal-header">
      <h3>Add New Version — ${reportId}</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="form-group"><label>Inspector Notes</label><textarea id="v-notes" placeholder="Updated inspection findings..."></textarea></div>
    <div class="form-group"><label>Result</label>
      <select id="v-result">
        <option value="pending">Pending</option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
      </select>
    </div>
    <div class="form-group"><label>Update Overall Status</label>
      <select id="v-status">
        <option value="pending">Pending</option>
        <option value="pass">Pass</option>
        <option value="fail">Fail</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="submitVersion('${reportId}')">Submit Version</button>
    </div>`);
}

async function submitVersion(reportId) {
  const payload = {
    inspector_notes: document.getElementById('v-notes').value,
    overall_result:  document.getElementById('v-result').value,
    overall_status:  document.getElementById('v-status').value
  };
  try {
    await api.addQCVersion(reportId, payload);
    showToast('New version added!');
    closeModal();
    renderQCReportDetail(reportId);
  } catch (err) { showToast(err.message, 'error'); }
}

async function approveCert(certId) {
  if (!confirm('This will permanently lock the certification. This cannot be undone. Continue?')) return;
  try {
    await api.approveCertification(certId);
    showToast('Certification approved and locked (immutable)');
    renderInspectorHome();
  } catch (err) { showToast(err.message, 'error'); }
}
