// Cargar Supabase desde CDN con soporte para módulos
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🔢 Reemplaza con tus datos de Supabase
const supabaseUrl = 'https://yqltoqrzeorkcetvqeud.supabase.co'; // Ej: https://abc123def456.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbHRvcXJ6ZW9ya2NldHZxZXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODM3ODQsImV4cCI6MjA3MTU1OTc4NH0.4jlDs7B9lo1WDQ5spDeyP--lYmqiAH6w6CfT9P4Z6Fk'; // Ve a: Settings → API en Supabase

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Elementos del DOM
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const logoutBtn = document.getElementById('logout');

// Pantallas
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

// Formulario de tareas
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// Búsqueda y gestión de usuarios
const searchUser = document.getElementById('search-user');
const userList = document.getElementById('user-list');
const addUserBtn = document.getElementById('add-user-btn');
const userModal = document.getElementById('user-modal');
const addUserForm = document.getElementById('add-user-form');
const cancelUserBtn = document.getElementById('cancel-user');

// PWA: Registrar service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.log('Error al registrar SW:', err));
}

// Verificar sesión del usuario
// Verificar sesión del usuario
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    showApp(session.user);
  } else {
    showLogin();
  }
  
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      showApp(session.user);
    } else if (event === 'SIGNED_OUT') {
      showLogin();
    }
  });
}

// Mostrar pantalla de login
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

  // Limpiar mensaje
  authMessage.textContent = '';
  authMessage.style.color = 'black';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = error.message;
    authMessage.style.color = 'red';
  }
});

// Botón de registro: valida y registra con Supabase Auth
document.getElementById('register-btn').addEventListener('click', async () => {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const email = emailInput.value;
  const password = passwordInput.value;

  // Limpiar mensaje anterior
  authMessage.textContent = '';
  authMessage.style.color = 'black';

  // Validaciones
  if (!email || !password) {
    authMessage.textContent = 'Por favor, ingresa tu correo y contraseña';
    authMessage.style.color = 'red';
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    authMessage.textContent = 'Por favor, ingresa un correo válido';
    authMessage.style.color = 'red';
    return;
  }

  if (password.length < 6) {
    authMessage.textContent = 'La contraseña debe tener al menos 6 caracteres';
    authMessage.style.color = 'red';
    return;
  }

  // Intentar registro
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    authMessage.textContent = error.message;
    authMessage.style.color = 'red';
  } else {
    authMessage.textContent = '✅ ¡Registro exitoso! Revisa tu correo para confirmar.';
    authMessage.style.color = 'green';
    emailInput.value = '';
    passwordInput.value = '';
  }
});

// Cerrar sesión
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Guardar nueva tarea
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

  if (error) {
    alert('Error al guardar: ' + error.message);
  } else {
    taskForm.reset();
    loadTasks();
    loadCalendar();
    loadStats();
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

// Formato de fecha legible
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

// Cargar calendario (vista básica de 35 días)
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

    dayEl.addEventListener('click', () => {
      alert(`Tareas programadas para ${dayEl.dataset.date}`);
    });
    days.appendChild(dayEl);
  }
}

// Cargar estadísticas en el dashboard
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
  const userContainer = document.getElementById('user-list');
  const noUsersMessage = document.querySelector('.no-users-message');

  // ✅ Validar que el elemento exista
  if (!noUsersMessage) {
    console.warn('Advertencia: No se encontró el elemento .no-users-message. Verifica el HTML.');
    return;
  }

  if (users.length === 0) {
    userContainer.innerHTML = '';
    noUsersMessage.classList.remove('hidden');
  } else {
    noUsersMessage.classList.add('hidden');
    userContainer.innerHTML = users.map(u => `
      <div class="user-card">
        <div class="user-info">
          <h3>${u.nombre} ${u.apellido}</h3>
          <p>${u.empresa || u.nombre}</p>
          <p>${u.email}</p>
        </div>
        <button class="informe-btn">
          <span>📄</span> Informe
        </button>
      </div>
    `).join('');
  }
}

// Exportar PDF (simulado)
document.getElementById('export-pdf').addEventListener('click', () => {
  alert('Función: Generar PDF del dashboard (usa jsPDF en producción)');
});
document.getElementById('export-user-pdf').addEventListener('click', () => {
  alert('Función: Generar PDF de usuarios');
});

// Navegación entre pantallas
navDashboard.addEventListener('click', () => showScreen(dashboard));
navCalendar.addEventListener('click', () => showScreen(calendar));
navTasks.addEventListener('click', () => showScreen(tasks));
navUsers.addEventListener('click', () => showScreen(users));

function showScreen(screen) {
  [dashboard, calendar, tasks, users].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

// Botón "Agregar Usuario"
addUserBtn.addEventListener('click', () => {
  userModal.classList.remove('hidden');
});

// Cancelar y cerrar modal
cancelUserBtn.addEventListener('click', () => {
  userModal.classList.add('hidden');
  addUserForm.reset();
});

// Guardar nuevo usuario
addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const email = document.getElementById('add-user-email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();

  // Validaciones
  if (!nombre || !apellido || !email) {
    alert('Por favor, completa los campos obligatorios: Nombre, Apellido y Correo');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Por favor, ingresa un correo válido');
    return;
  }

  // Insertar en la tabla 'perfiles'
  const { error } = await supabase.from('perfiles').insert([{ nombre, apellido, email, empresa }]);

  if (error) {
    alert('Error al guardar el usuario: ' + error.message);
  } else {
    alert('✅ Usuario agregado con éxito');
    userModal.classList.add('hidden');
    addUserForm.reset();
    loadUsers(); // Actualiza la lista
  }
});

// Iniciar la app
checkUser();