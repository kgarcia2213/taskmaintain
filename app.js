// 🔥 Función para mostrar secciones
function showSection(sectionId) {
  document.querySelectorAll("main section").forEach(section => {
    section.classList.add("hidden");
  });
  document.getElementById(sectionId).classList.remove("hidden");
}

// 🔹 Navegación
document.getElementById("navHome").addEventListener("click", () => {
  showSection("home");
});

document.getElementById("navUsers").addEventListener("click", () => {
  showSection("users");
  document.getElementById("add-user-form").classList.add("hidden");
  document.getElementById("user-list").classList.remove("hidden");
  loadUsers();
});

document.getElementById("navSettings").addEventListener("click", () => {
  showSection("settings");
});

// 🔹 Mostrar formulario de agregar usuario
document.getElementById("btnShowAddUser").addEventListener("click", () => {
  document.getElementById("add-user-form").classList.remove("hidden");
  document.getElementById("user-list").classList.add("hidden");
});

// 🔹 Cancelar agregar usuario
document.getElementById("btnCancelAdd").addEventListener("click", () => {
  document.getElementById("add-user-form").classList.add("hidden");
  document.getElementById("user-list").classList.remove("hidden");
});

// 🔹 Cargar lista de usuarios
function loadUsers() {
  const users = [
    { id: 1, name: "Juan Pérez", email: "juan@example.com" },
    { id: 2, name: "Ana López", email: "ana@example.com" }
  ];

  const userList = document.getElementById("userItems");
  userList.innerHTML = "";

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.name} - ${user.email}`;
    userList.appendChild(li);
  });
}

// 🔹 Manejar envío de formulario
document.getElementById("formAddUser").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();

  if (name && email) {
    alert(`Usuario agregado:\nNombre: ${name}\nCorreo: ${email}`);

    // 🔥 Resetear y volver a lista
    e.target.reset();
    document.getElementById("add-user-form").classList.add("hidden");
    document.getElementById("user-list").classList.remove("hidden");
    loadUsers();
  }
});

// 🔹 Inicializar lista al cargar
window.addEventListener("DOMContentLoaded", () => {
  loadUsers();
});
