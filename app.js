import { supabase } from './lib/supabaseClient';

// Elementos
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout');

// Screens
const dashboard = document.getElementById('dashboard');
const calendar = document.getElementById('calendar');
const tasks = document.getElementById('tasks');
const users = document.getElementById('users');
const navDashboard = document.getElementById('nav-dashboard');
const navCalendar = document.getElementById('nav-calendar');
const navTasks = document.getElementById('nav-tasks');
const navUsers = document.getElementById('nav-users');

// Dashboard stats
const totalTasks = document.getElementById('total-tasks');
const pendingTasks = document.getElementById('pending-tasks');
const overdueTasks = document.getElementById('overdue-tasks');
const completedTasks = document.getElementById('completed-tasks');

// Task form
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// User search
const searchUser = document.getElementById('search-user');
const userList = document.getElementById('user-list');

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

// Autenticación
async function checkUser() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    showApp(data.session.user);
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

// Login y Registro
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    authMessage.textContent = error.message;
  }
});

document.getElementById('register-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    authMessage.textContent = error.message;
  } else {
    authMessage.textContent = 'Revisa tu correo para confirmar';
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Tareas
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const desc = document.getElementById('task-desc').value;
  const start = document.getElementById('task-start').value;
  const end = document.getElementById('task-end').value;
  const notes = document.getElementById('task-notes').value;

  const { error } = await supabase.from('tareas').insert([{ 
    titulo: title, 
    descripcion: desc, 
    fecha_inicio: start, 
    fecha_fin: end, 
    observaciones: notes, 
    usuario_id: supabase.auth.user()?.id, 
    estado: 'pendiente' 
  }]);

  if (!error) {
    taskForm.reset();
    loadTasks();
    loadCalendar();
    loadStats();
  }
});

async function loadTasks() {
  const { data } = await supabase.from('tareas').select().order('fecha_inicio', { ascending: false });
  taskList.innerHTML = data?.map(t => `
    <div class="task-item ${isOverdue(t.fecha_fin) && t.estado !== 'completado' ? 'overdue' : ''} ${t.estado === 'completado' ? 'completed' : ''}">
      <strong>${t.titulo}</strong><br>
      ${t.descripcion} <br>
      ${formatDate(t.fecha_inicio)} → ${formatDate(t.fecha_fin)} <br>
      <small>Estado: ${t.estado}</small><br>
      <button onclick="editTask('${t.id}', '${t.observaciones}')">Editar</button>
    </div>
  `).join('');
}

function isOverdue(date) {
  return new Date(date) < new Date() && new Date(date).setHours(0,0,0,0) !== new Date().setHours(0,0,0,0);
}

// Edición de tareas
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

    // Verificar si hay tareas
    const hasTask = false; // Aquí puedes agregar lógica real
    if (hasTask) dayEl.classList.add('has-task');

    dayEl.addEventListener('click', () => {
      alert(`Tareas programadas para ${dayEl.dataset.date}`);
    });

    days.appendChild(dayEl);
  }
}

// Dashboard
async function loadStats() {
  const { data } = await supabase.from('tareas').select('estado, fecha_fin');
  const now = new Date();

  totalTasks.textContent = data?.length || 0;
  pendingTasks.textContent = data?.filter(t => t.estado === 'pendiente').length || 0;
  completedTasks.textContent = data?.filter(t => t.estado === 'completado').length || 0;
  overdueTasks.textContent = data?.filter(t => t.estado === 'pendiente' && new Date(t.fecha_fin) < now).length || 0;
}

// Búsqueda de usuarios
async function loadUsers() {
  const { data } = await supabase.from('perfiles').select();
  renderUsers(data);

  searchUser.addEventListener('input', () => {
    const term = searchUser.value.toLowerCase();
    const filtered = data.filter(u => 
      (u.nombre || '').toLowerCase().includes(term) || 
      (u.apellido || '').toLowerCase().includes(term)
    );
    renderUsers(filtered);
  });
}

function renderUsers(users) {
  userList.innerHTML = users.map(u => `
    <div class="task-item">
      ${u.nombre} ${u.apellido} - ${u.email}
    </div>
  `).join('');
}

// Generación de PDF (usa jsPDF)
document.getElementById('export-pdf').addEventListener('click', () => {
  alert('PDF del dashboard generado (usa jsPDF en producción)');
});

document.getElementById('export-user-pdf').addEventListener('click', () => {
  alert('PDF de usuarios generado');
});

// Navegación
navDashboard.addEventListener('click', () => showScreen(dashboard));
navCalendar.addEventListener('click', () => showScreen(calendar));
navTasks.addEventListener('click', () => showScreen(tasks));
navUsers.addEventListener('click', () => showScreen(users));

function showScreen(screen) {
  [dashboard, calendar, tasks, users].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

// Formato de fecha
function formatDate(date) {
  return new Date(date).toLocaleString();
}

// Iniciar app
checkUser();