import { supabase } from './lib/supabaseClient.js';

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout');

// Navegación
const navDashboard = document.getElementById('nav-dashboard');
const navCalendar = document.getElementById('nav-calendar');
const navTasks = document.getElementById('nav-tasks');
const navUsers = document.getElementById('nav-users');

// Screens
const dashboard = document.getElementById('dashboard');
const calendar = document.getElementById('calendar');
const tasks = document.getElementById('tasks');
const users = document.getElementById('users');

// Dashboard stats
const totalTasks = document.getElementById('total-tasks');
const pendingTasks = document.getElementById('pending-tasks');
const overdueTasks = document.getElementById('overdue-tasks');
const completedTasks = document.getElementById('completed-tasks');

// Formulario de tareas
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// Usuarios
const addUserBtn = document.getElementById('add-user-btn');
const userModal = document.getElementById('user-modal');
const addUserForm = document.getElementById('add-user-form');
const cancelUserBtn = document.getElementById('cancel-user');
const searchUser = document.getElementById('search-user');
const userList = document.getElementById('user-list');

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.error('Error al registrar SW:', err));
}

// Verificar sesión
async function checkUser() {
  const { data:  { session } } = await supabase.auth.getSession();
  if (session) {
    showApp(session.user);
  } else {
    showLogin();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      showApp(session.user);
    } else if (event === 'SIGNED_OUT') {
      showLogin();
    }
  });
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

function showApp(user) {
  loginScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  loadTasks();
  loadStats();
  loadCalendar();
  loadUsers();
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  authMessage.textContent = '';
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = error.message;
    authMessage.style.color = 'red';
  }
});

// Registro
document.getElementById('register-btn').addEventListener('click', async () => {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const email = emailInput.value;
  const password = passwordInput.value;

  authMessage.textContent = '';
  authMessage.style.color = 'black';

  if (!email || !password) {
    authMessage.textContent = 'Por favor, ingresa tu correo y contraseña';
    authMessage.style.color = 'red';
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    authMessage.textContent = 'Correo inválido';
    authMessage.style.color = 'red';
    return;
  }

  if (password.length < 6) {
    authMessage.textContent = 'La contraseña debe tener al menos 6 caracteres';
    authMessage.style.color = 'red';
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    authMessage.textContent = error.message;
    authMessage.style.color = 'red';
  } else {
    authMessage.textContent = '✅ Revisa tu correo para confirmar';
    authMessage.style.color = 'green';
    emailInput.value = '';
    passwordInput.value = '';
  }
});

// Cerrar sesión
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Navegación
[navDashboard, navCalendar, navTasks, navUsers].forEach(btn => {
  btn.addEventListener('click', () => {
    [dashboard, calendar, tasks, users].forEach(s => s.classList.add('hidden'));
  });
});
navDashboard.addEventListener('click', () => dashboard.classList.remove('hidden'));
navCalendar.addEventListener('click', () => calendar.classList.remove('hidden'));
navTasks.addEventListener('click', () => tasks.classList.remove('hidden'));
navUsers.addEventListener('click', () => users.classList.remove('hidden'));

// Modal de agregar usuario
addUserBtn.addEventListener('click', () => userModal.classList.remove('hidden'));
cancelUserBtn.addEventListener('click', () => {
  userModal.classList.add('hidden');
  addUserForm.reset();
});

addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const email = document.getElementById('add-user-email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();

  if (!nombre || !apellido || !email) {
    alert('Completa todos los campos obligatorios');
    return;
  }

  const { error } = await supabase.from('perfiles').insert([{ nombre, apellido, email, empresa }]);
  if (error) {
    alert('Error: ' + error.message);
  } else {
    alert('Usuario agregado');
    userModal.classList.add('hidden');
    addUserForm.reset();
    loadUsers();
  }
});

// Cargar usuarios
async function loadUsers() {
  const { data } = await supabase.from('perfiles').select();
  renderUsers(data || []);

  searchUser.addEventListener('input', () => {
    const term = searchUser.value.toLowerCase();
    const filtered = data?.filter(u =>
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.apellido || '').toLowerCase().includes(term)
    ) || [];
    renderUsers(filtered);
  });
}

function renderUsers(users) {
  const noUsersMessage = document.querySelector('.no-users-message');
  if (!noUsersMessage) return;

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

// Dashboard
async function loadStats() {
  const { data } = await supabase.from('tareas').select('estado, fecha_fin');
  const now = new Date();
  const overdue = data?.filter(t => t.estado === 'pendiente' && new Date(t.fecha_fin) < now).length || 0;

  totalTasks.textContent = data?.length || 0;
  pendingTasks.textContent = data?.filter(t => t.estado === 'pendiente').length || 0;
  completedTasks.textContent = data?.filter(t => t.estado === 'completado').length || 0;
  overdueTasks.textContent = overdue;
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
  taskList.innerHTML = data?.map(t => `
    <div class="task-item">
      <strong>${t.titulo}</strong> - ${t.descripcion} <br>
      ${new Date(t.fecha_inicio).toLocaleString()} → ${new Date(t.fecha_fin).toLocaleString()}
    </div>
  `).join('') || 'No hay tareas';
}

// Iniciar app
checkUser();