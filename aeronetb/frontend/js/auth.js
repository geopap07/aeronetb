// Auth management (in-memory — no localStorage)
let currentUser = null;
let authToken   = null;

function getUser()  { return currentUser; }
function getToken() { return authToken; }

function setSession(token, user) {
  authToken   = token;
  currentUser = user;
  api.setToken(token);
}

function clearSession() {
  authToken   = null;
  currentUser = null;
  api.setToken(null);
}

function logout() {
  clearSession();
  showLoginPage();
}

function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('dashboard-page').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'flex';
}

function fillLogin(email) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = 'Password123!';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.style.display = 'none';

  try {
    const res = await api.login(email, password);
    setSession(res.token, res.user);
    showDashboard();
    initDashboard(res.user);
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
    errEl.style.display = 'block';
  }
});
