import { supabase } from './lib/supabaseClient.js';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const authMessage = document.getElementById('auth-message');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout');
const registerBtn = document.getElementById('register-btn');
const searchUser = document.getElementById('search-user');
const userList = document.getElementById('user-list');
const noUsersMessage = document.querySelector('.no-users-message');
const userModal = document.getElementById('user-modal');
const addUserBtn = document.getElementById('add-user-btn');
const cancelUserBtn = document.getElementById('cancel-user');
const addUserForm = document.getElementById('add-user-form');

// Auth Check
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) showApp();
  else showLogin();

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') showApp();
    else if (event === 'SIGNED_OUT') showLogin();
  });
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

function showApp() {
  loginScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  loadDashboard();
  loadCalendar();
  loadTasks();
  loadUsers();
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  authMessage.textContent = error ? error.message : '';
  authMessage.style.color = error ? 'red' : '';
});

// Registro
registerBtn.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showError('Por favor, ingresa tu correo y contraseña');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Correo inválido');
  if (password.length < 6) return showError('La contraseña debe tener al menos 6 caracteres');

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) showError(error.message);
  else showSuccess('✅ Revisa tu correo para confirmar');
});

function showError(msg) {
  authMessage.textContent = msg;
  authMessage.style.color = 'red';
}

function showSuccess(msg) {
  authMessage.textContent = msg;
  authMessage.style.color = 'green';
}

// Logout
logoutBtn.addEventListener('click', async () => await supabase.auth.signOut());

// Navegación dinámica
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(btn.dataset.target).classList.remove('hidden');
  });
});

// Modal Usuarios
addUserBtn.addEventListener('click', () => userModal.classList.remove('hidden'));
cancelUserBtn.addEventListener('click', () => {
  userModal.classList.add('hidden');
  addUserForm.reset();
});
window.addEventListener('click', e => {
  if (e.target === userModal) {
    userModal.classList.add('hidden');
    addUserForm.reset();
  }
});

// CRUD Usuarios
addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const email = document.getElementById('add-user-email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();

  if (!nombre || !apellido || !email) return alert('Completa todos los campos obligatorios');
  const { error } = await supabase.from('perfiles').insert([{ nombre, apellido, email, empresa }]);

  if (error) alert('Error: ' + error.message);
  else {
    alert('Usuario agregado');
    userModal.classList.add('hidden');
    addUserForm.reset();
    loadUsers();
  }
});

async function loadUsers() {
  const { data } = await supabase.from('perfiles').select();
  renderUsers(data || []);
}

function renderUsers(users) {
  if (users.length === 0) {
    noUsersMessage.classList.remove('hidden');
    userList.innerHTML = '';
  } else {
    noUsersMessage.classList.add('hidden');
    userList.innerHTML = users.map(u => `
      <div class="user-card">
        <div class="user-info">
          <h3>${u.nombre} ${u.apellido}</h3>
          <p>${u.empresa || 'Sin empresa'}</p>
          <p>${u.email}</p>
        </div>
        <button class="informe-btn"><span>📄</span> Informe</button>
      </div>
    `).join('');
  }
}

searchUser.addEventListener('input', async () => {
  const term = searchUser.value.toLowerCase();
  const { data } = await supabase.from('perfiles').select();
  const filtered = data?.filter(u =>
    (u.nombre || '').toLowerCase().includes(term) ||
    (u.apellido || '').toLowerCase().includes(term)
  ) || [];
  renderUsers(filtered);
});

// Dashboard
async function loadDashboard() {
  const { data } = await supabase.from('tareas').select('estado, fecha_fin');
  const now = new Date();
  const overdue = data?.filter(t => t.estado === 'pendiente' && new Date(t.fecha_fin) < now).length || 0;

  document.getElementById('total-tasks').textContent = data?.length || 0;
  document.getElementById('pending-tasks').textContent = data?.filter(t => t.estado === 'pendiente').length || 0;
  document.getElementById('completed-tasks').textContent = data?.filter(t => t.estado === 'completado').length || 0;
  document.getElementById('overdue-tasks').textContent = overdue;
}

// Calendario
function loadCalendar() {
  const days = document.getElementById('calendar-days');
  days.innerHTML = '';
  const today = new Date();
  for (let i = 0; i < 35; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - 14 + i);
    const dayEl = document.createElement('div');
    dayEl.classList.add('day');
    dayEl.textContent = date.getDate();
    dayEl.dataset.date = date.toISOString().split('T')[0];
    dayEl.addEventListener('click', () => alert(`Tareas del ${dayEl.dataset.date}`));
    days.appendChild(dayEl);
  }
}

// Tareas
async function loadTasks() {
  const { data } = await supabase.from('tareas').select();
  document.getElementById('task-list').innerHTML = data?.map(t => `
    <div class="task-item">
      <strong>${t.titulo}</strong> - ${t.descripcion} <br>
      ${new Date(t.fecha_inicio).toLocaleString()} → ${new Date(t.fecha_fin).toLocaleString()}
    </div>
  `).join('') || 'No hay tareas';
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.error('Error al registrar SW:', err));
}

// Init
checkUser();
