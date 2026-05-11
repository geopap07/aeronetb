// AeroNetB — main app controller

const NAV_CONFIG = {
  procurement: [
    { id: 'nav-proc-home',  icon: '📋', label: 'Dashboard',       fn: 'renderProcurementHome' },
    { id: 'nav-proc-order', icon: '➕', label: 'New Order',        fn: 'renderCreateOrder' },
    { id: 'nav-proc-orders',icon: '📦', label: 'All Orders',       fn: 'renderAllOrders' },
  ],
  inspector: [
    { id: 'nav-insp-home',  icon: '🔬', label: 'QC Dashboard',     fn: 'renderInspectorHome' },
    { id: 'nav-insp-new',   icon: '➕', label: 'New QC Report',     fn: 'renderCreateQCReport' },
  ],
  manager: [
    { id: 'nav-mgr-home',   icon: '🌍', label: 'Supply Overview',  fn: 'renderManagerHome' },
  ],
  engineer: [
    { id: 'nav-eng-home',   icon: '⚙️', label: 'IoT Monitor',       fn: 'renderEngineerHome' },
  ],
  auditor: [
    { id: 'nav-aud-home',   icon: '🛡', label: 'Compliance View',  fn: 'renderAuditorHome' },
  ],
  admin: [
    { id: 'nav-proc-home',  icon: '📋', label: 'Procurement',      fn: 'renderProcurementHome' },
    { id: 'nav-insp-home',  icon: '🔬', label: 'QC Reports',       fn: 'renderInspectorHome' },
    { id: 'nav-mgr-home',   icon: '🌍', label: 'Supply Chain',     fn: 'renderManagerHome' },
    { id: 'nav-eng-home',   icon: '⚙️', label: 'IoT Monitor',       fn: 'renderEngineerHome' },
    { id: 'nav-aud-home',   icon: '🛡', label: 'Audit Log',        fn: 'renderAuditorHome' },
  ]
};

const ROLE_LABELS = {
  procurement: 'Procurement Officer',
  inspector:   'Quality Inspector',
  manager:     'Supply Chain Manager',
  engineer:    'Equipment Engineer',
  auditor:     'Auditor / Regulator',
  admin:       'System Administrator'
};

function buildSidebar(user) {
  const items = NAV_CONFIG[user.role] || NAV_CONFIG.admin;
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = `
    <div class="nav-section">${ROLE_LABELS[user.role] || user.role}</div>
    ${items.map(item => `
      <div class="nav-item" id="${item.id}" onclick="${item.fn}()">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </div>`).join('')}`;

  document.getElementById('user-info').innerHTML = `
    <div class="user-name">${user.full_name}</div>
    <div class="user-role">${user.department || ROLE_LABELS[user.role]}</div>`;
}

function initDashboard(user) {
  buildSidebar(user);

  // Load the default page for the role
  const defaults = {
    procurement: renderProcurementHome,
    inspector:   renderInspectorHome,
    manager:     renderManagerHome,
    engineer:    renderEngineerHome,
    auditor:     renderAuditorHome,
    admin:       renderProcurementHome
  };
  (defaults[user.role] || renderProcurementHome)();
}
