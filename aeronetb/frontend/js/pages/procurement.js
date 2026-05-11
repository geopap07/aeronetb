// Procurement Officer dashboard pages

async function renderProcurementHome() {
  setActiveNav('nav-proc-home');
  renderPage('<div class="loading">Loading...</div>');
  try {
    const [orders, suppliers] = await Promise.all([api.getOrders(), api.getSuppliers()]);
    const active   = orders.filter(o => !['completed','cancelled'].includes(o.status));
    const overdue  = orders.filter(o => isOverdue(o.desired_delivery) && !['completed','cancelled'].includes(o.status));
    const html = `
      <div class="page-header">
        <div><h2>Procurement Overview</h2><p>Manage suppliers and purchase orders</p></div>
        <div class="header-actions">
          <button class="btn-primary btn-sm" onclick="renderCreateOrder()">+ New Order</button>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card blue"><div class="stat-label">Active Orders</div><div class="stat-value">${active.length}</div></div>
        <div class="stat-card ${overdue.length > 0 ? 'red' : 'green'}"><div class="stat-label">Overdue</div><div class="stat-value">${overdue.length}</div></div>
        <div class="stat-card blue"><div class="stat-label">Suppliers</div><div class="stat-value">${suppliers.length}</div></div>
        <div class="stat-card green"><div class="stat-label">Completed</div><div class="stat-value">${orders.filter(o=>o.status==='completed').length}</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span>Recent Purchase Orders</span>
          <button class="btn-ghost btn-sm" onclick="renderAllOrders()">View all</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order #</th><th>Supplier</th><th>Status</th><th>Value</th><th>Desired Delivery</th><th>Actions</th></tr></thead>
            <tbody>
              ${orders.slice(0,10).map(o => `
                <tr>
                  <td class="mono">#${o.order_id}</td>
                  <td>${o.supplier_name}<br><small class="text-muted">${o.supplier_country || ''}</small></td>
                  <td>${statusBadge(o.status)}</td>
                  <td>${fmtMoney(o.total_value_usd)}</td>
                  <td>${isOverdue(o.desired_delivery) && !['completed','cancelled'].includes(o.status)
                    ? `<span style="color:var(--red)">⚠ ${fmtDate(o.desired_delivery)}</span>`
                    : fmtDate(o.desired_delivery)}</td>
                  <td><button class="btn-ghost btn-sm" onclick="renderOrderDetail(${o.order_id})">View</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span>Suppliers</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Supplier</th><th>Country</th><th>Accreditation</th><th>On-time %</th><th>Total Orders</th></tr></thead>
            <tbody>
              ${suppliers.map(s => `
                <tr>
                  <td><strong>${s.business_name}</strong><br><small class="text-muted">${s.contact_email||''}</small></td>
                  <td>${s.country || '—'}</td>
                  <td><span class="badge badge-blue">${s.accreditation_status||'Pending'}</span></td>
                  <td>${miniBar(s.on_time_pct || 0, 100, 'var(--green)')}</td>
                  <td class="mono">${s.total_orders || 0}</td>
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

async function renderCreateOrder() {
  setActiveNav('nav-proc-order');
  try {
    const [suppliers, parts] = await Promise.all([api.getSuppliers(), api.getParts()]);
    renderPage(`
      <div class="page-header"><div><h2>Create Purchase Order</h2></div></div>
      <div class="card"><div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Supplier</label>
            <select id="po-supplier">
              <option value="">— Select supplier —</option>
              ${suppliers.map(s => `<option value="${s.supplier_id}">${s.business_name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Desired Delivery Date</label>
            <input type="date" id="po-delivery" min="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group span2">
            <label>Notes</label>
            <textarea id="po-notes" placeholder="Order notes..."></textarea>
          </div>
        </div>
        <div class="card" style="margin-top:0">
          <div class="card-header"><span>Order Lines</span>
            <button class="btn-ghost btn-sm" onclick="addOrderLine()">+ Add Part</button>
          </div>
          <div id="order-lines-container" style="padding:1rem">
            <p class="text-muted" style="font-size:0.85rem">Click "Add Part" to add items to this order.</p>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:1rem">
          <span id="po-total" style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;color:var(--blue)">Total: $0</span>
          <div class="form-actions" style="margin:0">
            <button class="btn-secondary" onclick="renderProcurementHome()">Cancel</button>
            <button class="btn-primary" onclick="submitOrder()">Submit Order</button>
          </div>
        </div>
      </div></div>`);
    window._orderLines = [];
    window._parts = parts;
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}

function addOrderLine() {
  const lines = window._orderLines || [];
  const parts = window._parts || [];
  const idx = lines.length;
  lines.push({ part_id: '', quantity: 1, unit_price_usd: 0 });
  window._orderLines = lines;
  const container = document.getElementById('order-lines-container');
  container.innerHTML = lines.map((l, i) => `
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px" id="line-${i}">
      <div class="form-group" style="margin:0">
        <label>Part</label>
        <select onchange="updateLine(${i},'part_id',this.value)">
          <option value="">— Select —</option>
          ${parts.map(p => `<option value="${p.part_id}" ${l.part_id==p.part_id?'selected':''}>${p.part_name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label>Qty</label>
        <input type="number" min="1" value="${l.quantity}" onchange="updateLine(${i},'quantity',+this.value)">
      </div>
      <div class="form-group" style="margin:0">
        <label>Unit Price (USD)</label>
        <input type="number" step="0.01" value="${l.unit_price_usd}" onchange="updateLine(${i},'unit_price_usd',+this.value)">
      </div>
      <button class="btn-ghost btn-sm" style="margin-bottom:2px" onclick="removeLine(${i})">✕</button>
    </div>`).join('');
  recalcTotal();
}

function updateLine(i, field, val) {
  window._orderLines[i][field] = val;
  recalcTotal();
}

function removeLine(i) {
  window._orderLines.splice(i, 1);
  addOrderLine(); // re-render
  if (window._orderLines.length === 0)
    document.getElementById('order-lines-container').innerHTML = '<p class="text-muted" style="font-size:0.85rem">Click "Add Part" to add items.</p>';
}

function recalcTotal() {
  const total = (window._orderLines || []).reduce((s, l) => s + (l.quantity * l.unit_price_usd), 0);
  const el = document.getElementById('po-total');
  if (el) el.textContent = 'Total: ' + fmtMoney(total);
}

async function submitOrder() {
  const supplier_id     = document.getElementById('po-supplier').value;
  const desired_delivery = document.getElementById('po-delivery').value;
  const notes           = document.getElementById('po-notes').value;
  if (!supplier_id) return showToast('Please select a supplier', 'error');
  if (!window._orderLines?.length) return showToast('Add at least one order line', 'error');

  try {
    await api.createOrder({ supplier_id, desired_delivery, notes, lines: window._orderLines });
    showToast('Purchase order created successfully!');
    renderProcurementHome();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function renderOrderDetail(orderId) {
  try {
    const order = await api.getOrder(orderId);
    const html = `
      <div class="page-header">
        <div><h2>Order #${order.order_id}</h2><p>${order.supplier_name}</p></div>
        <div class="header-actions">
          ${!['completed','cancelled'].includes(order.status) ? `
            <select id="status-select" style="padding:0.4rem 0.6rem;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit">
              <option>placed</option><option>confirmed</option><option>dispatched</option>
              <option>delivered</option><option>completed</option><option>cancelled</option>
            </select>
            <button class="btn-primary btn-sm" onclick="updateStatus(${order.order_id})">Update Status</button>
          ` : ''}
          <button class="btn-ghost btn-sm" onclick="renderProcurementHome()">← Back</button>
        </div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-body">
          <table style="width:100%">
            <tr><td class="text-muted">Status</td><td>${statusBadge(order.status)}</td></tr>
            <tr><td class="text-muted">Supplier</td><td>${order.supplier_name}</td></tr>
            <tr><td class="text-muted">Order Date</td><td>${fmtDate(order.order_date)}</td></tr>
            <tr><td class="text-muted">Desired Delivery</td><td>${fmtDate(order.desired_delivery)}</td></tr>
            <tr><td class="text-muted">Actual Delivery</td><td>${fmtDate(order.actual_delivery)}</td></tr>
            <tr><td class="text-muted">Total Value</td><td style="color:var(--blue);font-weight:500">${fmtMoney(order.total_value_usd)}</td></tr>
            <tr><td class="text-muted">Notes</td><td>${order.notes || '—'}</td></tr>
          </table>
        </div></div>
        <div class="card"><div class="card-header">Order Lines</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Part</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
              <tbody>
                ${order.lines.map(l => `
                  <tr>
                    <td>${l.part_name}<br><small class="text-muted">${l.part_category||''}</small></td>
                    <td class="mono">${l.quantity}</td>
                    <td>${fmtMoney(l.unit_price_usd)}</td>
                    <td>${fmtMoney(l.line_total_usd)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card"><div class="card-header">Shipments</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tracking Ref</th><th>Carrier</th><th>Port of Entry</th><th>ETA</th><th>Status</th></tr></thead>
            <tbody>
              ${order.shipments.length ? order.shipments.map(s => `
                <tr>
                  <td class="mono">${s.tracking_ref||'—'}</td>
                  <td>${s.carrier||'—'}</td>
                  <td>${s.port_of_entry||'—'}</td>
                  <td>${fmtDate(s.eta)}</td>
                  <td>${statusBadge(s.status)}</td>
                </tr>`).join('') : '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:1.5rem">No shipments yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
    renderPage(html);
    if (!['completed','cancelled'].includes(order.status)) {
      document.getElementById('status-select').value = order.status;
    }
  } catch (err) {
    renderPage(`<div class="error-msg">${err.message}</div>`);
  }
}

async function updateStatus(orderId) {
  const status = document.getElementById('status-select').value;
  try {
    await api.updateOrderStatus(orderId, status);
    showToast(`Order status updated to: ${status}`);
    renderOrderDetail(orderId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function renderAllOrders() {
  setActiveNav('nav-proc-home');
  try {
    const orders = await api.getOrders();
    renderPage(`
      <div class="page-header">
        <div><h2>All Purchase Orders</h2></div>
        <div class="header-actions">
          <button class="btn-primary btn-sm" onclick="renderCreateOrder()">+ New Order</button>
        </div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order #</th><th>Supplier</th><th>Status</th><th>Lines</th><th>Value</th><th>Order Date</th><th>Desired Delivery</th><th></th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td class="mono">#${o.order_id}</td>
                  <td>${o.supplier_name}</td>
                  <td>${statusBadge(o.status)}</td>
                  <td class="mono">${o.line_count}</td>
                  <td>${fmtMoney(o.total_value_usd)}</td>
                  <td>${fmtDate(o.order_date)}</td>
                  <td>${isOverdue(o.desired_delivery) && !['completed','cancelled'].includes(o.status)
                    ? `<span style="color:var(--red)">⚠ ${fmtDate(o.desired_delivery)}</span>`
                    : fmtDate(o.desired_delivery)}</td>
                  <td><button class="btn-ghost btn-sm" onclick="renderOrderDetail(${o.order_id})">View</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch(err) { renderPage(`<div class="error-msg">${err.message}</div>`); }
}
