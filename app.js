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

// Pantallas
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

// Búsqueda de usuarios
const searchUser = document.getElementById('search-user');
const userList = document.getElementById('user-list');

// Formulario emergente de agregar usuario
const toggleUserFormBtn = document.getElementById('toggle-user-form');
const userFormContainer = document.getElementById('user-form-container');
const addUserForm = document.getElementById('add-user-form');
const cancelUserFormBtn = document.getElementById('cancel-user-form');

// PWA: Registrar service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.error('Error al registrar SW:', err));
}

// Verificar sesión
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();
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

// Mostrar login
function showLogin() {
  loginScreen.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

// Mostrar app principal
function showApp(user) {
  loginScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  loadTasks();
  loadStats();
  loadCalendar();
  loadUsers();
}

// Iniciar sesión
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  authMessage.textContent = '';
  authMessage.style.color = 'black';

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
function showScreen(screen) {
  [dashboard, calendar, tasks, users].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

navDashboard.addEventListener('click', () => showScreen(dashboard));
navCalendar.addEventListener('click', () => showScreen(calendar));
navTasks.addEventListener('click', () => showScreen(tasks));
navUsers.addEventListener('click', () => {
  showScreen(users);
  loadUsers();
});

// Formulario emergente de agregar usuario
toggleUserFormBtn.addEventListener('click', () => {
  const isHidden = userFormContainer.classList.contains('hidden');
  userFormContainer.classList.toggle('hidden', !isHidden);
  toggleUserFormBtn.textContent = isHidden ? 'Cerrar Formulario' : '+ Agregar Usuario';
});

// Cancelar formulario
cancelUserFormBtn.addEventListener('click', () => {
  userFormContainer.classList.add('hidden');
  toggleUserFormBtn.textContent = '+ Agregar Usuario';
  addUserForm.reset();
});

// Guardar nuevo usuario
addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const email = document.getElementById('email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();

  if (!nombre || !apellido || !email) {
    alert('Completa todos los campos obligatorios');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Correo inválido');
    return;
  }

  const { error } = await supabase.from('perfiles').insert([{ nombre, apellido, email, empresa }]);
  if (error) {
    alert('Error: ' + error.message);
  } else {
    alert('✅ Usuario agregado con éxito');
    addUserForm.reset();
    userFormContainer.classList.add('hidden');
    toggleUserFormBtn.textContent = '+ Agregar Usuario';
    loadUsers();
  }
});

// Cargar lista de tareas
async function loadTasks() {
  const { data, error } = await supabase.from('tareas').select();
  if (error) {
    taskList.innerHTML = 'Error al cargar tareas.';
    return;
  }

  taskList.innerHTML = data.map(t => `
    <div class="task-item ${new Date(t.fecha_fin) < new Date() && t.estado !== 'completado' ? 'overdue' : ''}">
      <strong>${t.titulo}</strong><br>
      ${t.descripcion} <br>
      ${formatDate(t.fecha_inicio)} → ${formatDate(t.fecha_fin)} <br>
      <small>Estado: ${t.estado}</small><br>
      <button onclick="editTask('${t.id}', '${t.observaciones || ''}')">Editar</button>
    </div>
  `).join('');
}

// Formato de fecha
function formatDate(date) {
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Editar tarea
window.editTask = async (id, notes) => {
  const newNotes = prompt('Observaciones:', notes);
  if (newNotes !== null) {
    await supabase.from('tareas').update({ observaciones: newNotes }).eq('id', id);
    loadTasks();
  }
};

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

// Dashboard
async function loadStats() {
  const { data } = await supabase.from('tareas').select('estado, fecha_fin');
  const now = new Date();

  const total = data?.length || 0;
  const pending = data?.filter(t => t.estado === 'pendiente').length || 0;
  const completed = data?.filter(t => t.estado === 'completado').length || 0;
  const overdue = data?.filter(t => t.estado === 'pendiente' && new Date(t.fecha_fin) < now).length || 0;

  totalTasks.textContent = total;
  pendingTasks.textContent = pending;
  completedTasks.textContent = completed;
  overdueTasks.textContent = overdue;
}

// Cargar y buscar usuarios
async function loadUsers() {
  const { data } = await supabase.from('perfiles').select();

  if (data) renderUsers(data);

  if (searchUser) {
    searchUser.addEventListener('input', () => {
      const term = searchUser.value.toLowerCase();
      const filtered = data?.filter(u =>
        (u.nombre || '').toLowerCase().includes(term) ||
        (u.apellido || '').toLowerCase().includes(term)
      ) || [];
      renderUsers(filtered);
    });
  }
}

function renderUsers(users) {
  const noUsersMessage = document.querySelector('.no-users-message');
  if (!noUsersMessage) return;

  if (users.length === 0) {
    userList.innerHTML = '';
    noUsersMessage.classList.remove('hidden');
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

// Exportar PDF (simulado)
document.getElementById('export-pdf').addEventListener('click', () => {
  alert('Función: Generar PDF del dashboard');
});
document.getElementById('export-user-pdf').addEventListener('click', () => {
  alert('Función: Generar PDF de usuarios');
});

// Iniciar app
checkUser();