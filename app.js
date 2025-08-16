// app.js
// =========================
// Cambia aquí si tu backend está en otra URL
const API = "http://localhost:8080/api/tareas";

const form = document.getElementById("task-form");
const tituloInput = document.getElementById("titulo");
const descripcionInput = document.getElementById("descripcion");
const taskIdInput = document.getElementById("task-id");
const listEl = document.getElementById("task-list");
const btnCancel = document.getElementById("btn-cancel");

async function listarTareas() {
  try {
    const res = await fetch(API);
    const tareas = await res.json();
    renderTareas(tareas);
  } catch (err) {
    console.error("Error al listar tareas:", err);
    listEl.innerHTML = `<li class="list-group-item text-danger">No se pudo conectar al backend.</li>`;
  }
}

function renderTareas(tareas) {
  if (!Array.isArray(tareas) || tareas.length === 0) {
    listEl.innerHTML = `<li class="list-group-item">No hay tareas.</li>`;
    return;
  }

  listEl.innerHTML = tareas.map(t => `
    <li class="list-group-item d-flex justify-content-between align-items-start">
      <div>
        <strong>${escapeHtml(t.titulo)}</strong>
        <div class="small text-muted">${escapeHtml(t.descripcion || '')}</div>
        <div class="badge bg-${t.estado === 'Hecha' ? 'success' : t.estado === 'En Progreso' ? 'warning' : 'secondary'} mt-2">${t.estado || 'Pendiente'}</div>
      </div>
      <div class="btn-group">
        <button class="btn btn-sm btn-outline-primary" onclick="startEdit(${t.id})"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn btn-sm btn-outline-success" onclick="toggleStatus(${t.id}, '${t.estado || 'Pendiente'}')">${t.estado === 'Hecha' ? 'Marcar Pendiente' : 'Marcar Hecha'}</button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarTarea(${t.id})">Eliminar</button>
      </div>
    </li>
  `).join('');
}

// evitar inyección mínima
function escapeHtml(text) {
  return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = taskIdInput.value;
  const titulo = tituloInput.value.trim();
  const descripcion = descripcionInput.value.trim();

  if (!titulo) return alert("El título es obligatorio.");

  const payload = { titulo, descripcion, estado: "Pendiente" };

  try {
    if (id) {
      // actualizar
      await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, estado: "Pendiente" })
      });
    } else {
      // crear
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    form.reset();
    taskIdInput.value = "";
    listarTareas();
  } catch (err) {
    console.error("Error guardando tarea:", err);
    alert("Error al guardar (revisa consola).");
  }
});

btnCancel.addEventListener("click", () => {
  form.reset();
  taskIdInput.value = "";
});

window.startEdit = async function(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) return alert("Tarea no encontrada.");
    const t = await res.json();
    taskIdInput.value = t.id;
    tituloInput.value = t.titulo;
    descripcionInput.value = t.descripcion || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alert("Error al cargar tarea.");
  }
};

window.eliminarTarea = async function(id) {
  if (!confirm("¿Eliminar esta tarea?")) return;
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    listarTareas();
  } catch (err) {
    console.error(err);
    alert("Error al eliminar.");
  }
};

window.toggleStatus = async function(id, estadoActual) {
  const nuevo = estadoActual === "Hecha" ? "Pendiente" : "Hecha";
  try {
    // obtenemos la tarea completa primero
    const res = await fetch(`${API}/${id}`);
    const t = await res.json();
    t.estado = nuevo;
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t)
    });
    listarTareas();
  } catch (err) {
    console.error(err);
    alert("Error al actualizar estado.");
  }
};

// inicio
listarTareas();
