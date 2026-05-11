// Supply Chain Manager dashboard

async function renderManagerHome() {
  setActiveNav('nav-mgr-home');
  renderPage('<div class="loading">Loading...</div>');
  try {
    const [stats, shipments, suppliers] = await Promise.all([
      api.getDashboardStats(), api.getShipments(), api.getSuppliers()
    ]);
    const delayed = shipments.filter(s =>
      s.status === 'in_transit' && s.desired_delivery && isOverdue(s.desired_delivery)
    );
    const html = `
      <div class="page-header">
        <div><h2>Supply Chain Overview</h2><p>Global shipments and supplier analytics</p></div>
      </div>
      <div class="stat-grid">
        <div class="stat-card blue"><div class="stat-label">Total Suppliers</div><div class="stat-value">${stats.total_suppliers}</div></div>
        <div class="stat-card amber"><div class="stat-label">Active Orders</div><div class="stat-value">${stats.active_orders}</div></div>
        <div class="stat-card blue"><div class="stat-label">In Transit</div><div class="stat-value">${stats.in_transit}</div></div>
        <div class="stat-card ${delayed.length > 0 ? 'red' : 'green'}"><div class="stat-label">Delayed</div><div class="stat-value">${delayed.length}</div></div>
        <div class="stat-card green"><div class="stat-label">Certifications</div><div class="stat-value">${stats.certifications}</div></div>
        <div class="stat-card ${stats.qc_fail_count > 0 ? 'red' : 'green'}"><div class="stat-label">QC Failures</div><div class="stat-value">${stats.qc_fail_count}</div><div class="stat-sub">of ${stats.qc_total} reports</div></div>
      </div>
      ${delayed.length > 0 ? `
        <div class="card" style="border-color:var(--red)">
          <div class="card-header" style="color:var(--red)">⚠ Delayed Shipments</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tracking Ref</th><th>Supplier</th><th>Carrier</th><th>Planned Delivery</th><th>Last Location</th></tr></thead>
              <tbody>
                ${delayed.map(s => `
                  <tr>
                    <td class="mono">${s.tracking_ref||'—'}</td>
                    <td>${s.supplier_name}</td>
                    <td>${s.carrier||'—'}</td>
                    <td style="color:var(--red)">${fmtDate(s.desired_delivery)}</td>
                    <td>${s.last_location || '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
      <div class="card">
        <div class="card-header"><span>All Shipments</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tracking Ref</th><th>Supplier</th><th>Carrier</th><th>Port of Entry</th><th>ETA</th><th>Status</th><th>Last Location</th></tr></thead>
            <tbody>
              ${shipments.map(s => `
                <tr>
                  <td class="mono">${s.tracking_ref||'—'}</td>
                  <td>${s.supplier_name}</td>
                  <td>${s.carrier||'—'}</td>
                  <td>${s.port_of_entry||'—'}</td>
                  <td>${fmtDate(s.eta)}</td>
                  <td>${statusBadge(s.status)}</td>
                  <td>${s.last_location || '<span class="text-muted">—</span>'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span>Supplier Performance Scorecards</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Supplier</th><th>Region</th><th>Accreditation</th><th>On-time Delivery</th><th>Total Orders</th></tr></thead>
            <tbody>
              ${suppliers.map(s => `
                <tr>
                  <td><strong>${s.business_name}</strong><br><small class="text-muted">${s.country||''}</small></td>
                  <td>${s.region||'—'}</td>
                  <td><span class="badge badge-blue">${s.accreditation_status||'Pending'}</span></td>
                  <td>${miniBar(s.on_time_pct||0, 100, s.on_time_pct>=80 ? 'var(--green)' : s.on_time_pct>=50 ? 'var(--amber)' : 'var(--red)')}</td>
                  <td class="mono">${s.total_orders||0}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    renderPage(html);
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}
