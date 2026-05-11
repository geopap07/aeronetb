// Equipment Engineer - IoT monitoring

async function renderEngineerHome() {
  setActiveNav('nav-eng-home');
  renderPage('<div class="loading">Loading IoT device data...</div>');
  try {
    const devices = await api.getIoTDevices();
    const warnings = devices.filter(d => d.last_readings?.status === 'warning');
    const html = `
      <div class="page-header">
        <div><h2>IoT Equipment Monitor</h2><p>Bristol Plant A — live sensor readings</p></div>
        <div class="header-actions">
          <button class="btn-ghost btn-sm" onclick="renderEngineerHome()">↺ Refresh</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card blue"><div class="stat-label">Devices Online</div><div class="stat-value">${devices.length}</div></div>
        <div class="stat-card ${warnings.length > 0 ? 'amber' : 'green'}">
          <div class="stat-label">Warnings</div><div class="stat-value">${warnings.length}</div>
        </div>
        <div class="stat-card green"><div class="stat-label">Facility</div><div class="stat-value" style="font-size:0.9rem;padding-top:4px">Bristol A</div></div>
      </div>
      ${warnings.length > 0 ? `
        <div class="card" style="border-color:var(--amber)">
          <div class="card-header" style="color:var(--amber)">⚠ Devices requiring attention</div>
          <div style="padding:1rem;font-size:0.875rem;color:var(--text2)">
            ${warnings.map(d => `<div>— ${d.equipment_name} (${d.device_id}): status = <span style="color:var(--amber)">${d.last_readings?.status}</span></div>`).join('')}
          </div>
        </div>` : ''}
      <div class="device-grid">
        ${devices.map(d => {
          const s = d.last_readings?.status || 'unknown';
          const cardCls = s === 'warning' ? 'warn' : s === 'critical' ? 'crit' : '';
          const readings = Object.entries(d.last_readings || {})
            .filter(([k]) => k !== 'status')
            .map(([k, v]) => `<div><span>${k.replace(/_/g,' ')}</span><span>${typeof v === 'number' ? v.toFixed(1) : v}</span></div>`)
            .join('');
          return `
            <div class="device-card ${cardCls}" onclick="renderDeviceDetail('${d.device_id}')">
              <div style="display:flex;justify-content:space-between;align-items:start">
                <div class="device-name">${d.equipment_name}</div>
                ${statusBadge(s)}
              </div>
              <div style="font-size:0.75rem;color:var(--text3);margin-bottom:8px">${d.device_id} · ${d.equipment_type}</div>
              <div class="device-readings">${readings}</div>
              <div style="font-size:0.72rem;color:var(--text3);margin-top:8px">Last seen: ${fmtDateTime(d.last_seen)}</div>
            </div>`;
        }).join('')}
      </div>`;
    renderPage(html);
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}

async function renderDeviceDetail(deviceId) {
  try {
    const logs = await api.getIoTLogs(deviceId, 24);
    if (!logs.length) {
      renderPage(`<div class="empty-state">No logs found for device ${deviceId}</div>`);
      return;
    }
    const latest = logs[logs.length - 1];
    const readingKeys = Object.keys(latest.readings || {}).filter(k => k !== 'status');

    // Build a simple ASCII-style time series using reading values
    const chartRows = readingKeys.slice(0, 2).map(key => {
      const vals = logs.map(l => l.readings?.[key] ?? null).filter(v => v !== null);
      const min = Math.min(...vals), max = Math.max(...vals);
      const range = max - min || 1;
      const bars = vals.slice(-24).map(v => {
        const h = Math.max(2, Math.round(((v - min) / range) * 40));
        return `<div style="width:8px;height:${h}px;background:var(--blue);border-radius:2px;display:inline-block;margin:0 1px;vertical-align:bottom"></div>`;
      }).join('');
      return `
        <div class="card-header" style="padding:0.5rem 1rem">${key.replace(/_/g,' ')} — last 24 h</div>
        <div style="padding:1rem;display:flex;align-items:flex-end;gap:0;height:80px">${bars}</div>
        <div style="padding:0 1rem 0.5rem;font-size:0.75rem;color:var(--text3)">
          Min: ${min.toFixed(1)} · Max: ${max.toFixed(1)} · Latest: ${vals[vals.length-1]?.toFixed(1)}
        </div>`;
    }).join('');

    renderPage(`
      <div class="page-header">
        <div><h2>${latest.equipment_name}</h2><p>${deviceId} · ${latest.facility}</p></div>
        <div class="header-actions">
          <button class="btn-ghost btn-sm" onclick="renderEngineerHome()">← Back</button>
        </div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-header">Latest Readings</div>
          <div class="card-body">
            ${Object.entries(latest.readings || {}).map(([k, v]) => `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.875rem">
                <span class="text-muted">${k.replace(/_/g,' ')}</span>
                <span class="mono">${typeof v === 'number' ? v.toFixed(2) : v}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="card" style="grid-column:span 1">${chartRows}</div>
      </div>
      <div class="card">
        <div class="card-header"><span>24-hour Log (${logs.length} entries)</span></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Timestamp</th>${readingKeys.map(k=>`<th>${k.replace(/_/g,' ')}</th>`).join('')}<th>Status</th></tr>
            </thead>
            <tbody>
              ${logs.slice(-20).reverse().map(l => `
                <tr>
                  <td class="mono" style="font-size:0.78rem">${fmtDateTime(l.timestamp)}</td>
                  ${readingKeys.map(k => `<td class="mono">${l.readings?.[k] != null ? l.readings[k].toFixed ? l.readings[k].toFixed(1) : l.readings[k] : '—'}</td>`).join('')}
                  <td>${statusBadge(l.readings?.status || 'unknown')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}
