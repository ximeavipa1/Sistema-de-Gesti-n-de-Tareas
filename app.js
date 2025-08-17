// ==============================
// Configuración de API
// ==============================
// Si tu backend corre en Spring Boot (puerto 8080 por defecto):
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8080'
  : '';

// Ajusta aquí si tus rutas son distintas
const ENDPOINTS = {
  list: () => `${API_BASE}/api/tareas`,
  create: () => `${API_BASE}/api/tareas`,
  byId: (id) => `${API_BASE}/api/tareas/${id}`
};

// Mapea campos si en tu backend usan otros nombres
const mapFromApi = (t) => ({
  id: t.id,
  titulo: t.titulo ?? t.title ?? t.nombre ?? '',
  descripcion: t.descripcion ?? t.descripcionTarea ?? t.description ?? '',
  estado: t.estado ?? t.status ?? 'PENDIENTE',
  prioridad: t.prioridad ?? t.priority ?? 'MEDIA',
  asignadoA: t.asignadoA ?? t.asignado ?? t.owner ?? '',
  fechaEntrega: t.fechaEntrega ?? t.dueDate ?? ''
});

const mapToApi = (t) => ({
  id: t.id,
  titulo: t.titulo,
  descripcion: t.descripcion,
  estado: t.estado,
  prioridad: t.prioridad,
  asignadoA: t.asignadoA,
  fechaEntrega: t.fechaEntrega
});

// ==============================
// Estado local
// ==============================
let state = {
  tareas: [],
  filtros: { texto: '', estado: '', prioridad: '' }
};

// ==============================
// Utilidades
// ==============================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 2200);
}

function isoHoy() {
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// ==============================
// API Calls
// ==============================
async function apiList() {
  const res = await fetch(ENDPOINTS.list());
  if (!res.ok) throw new Error('Error al listar');
  const data = await res.json();
  return data.map(mapFromApi);
}

async function apiCreate(payload) {
  const res = await fetch(ENDPOINTS.create(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapToApi(payload))
  });
  if (!res.ok) throw new Error('Error al crear');
}

async function apiUpdate(id, payload) {
  const res = await fetch(ENDPOINTS.byId(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapToApi(payload))
  });
  if (!res.ok) throw new Error('Error al actualizar');
}

async function apiDelete(id) {
  const res = await fetch(ENDPOINTS.byId(id), { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar');
}

// ==============================
// Render del tablero y KPIs
// ==============================
function renderKpis(tareas) {
  const total = tareas.length;
  const pend = tareas.filter(t => t.estado === 'PENDIENTE').length;
  const prog = tareas.filter(t => t.estado === 'EN_PROGRESO').length;
  const comp = tareas.filter(t => t.estado === 'COMPLETADA').length;
  const pct = total ? Math.round((comp/total)*100) : 0;

  $('#kpis').innerHTML = `
    <div class="rounded-2xl bg-white shadow-sm p-4 border border-white">
      <div class="text-xs text-slate-500">Total tareas</div>
      <div class="mt-1 text-2xl font-semibold">${total}</div>
    </div>
    <div class="rounded-2xl bg-white shadow-sm p-4 border border-white">
      <div class="text-xs text-slate-500">Completadas</div>
      <div class="mt-1 text-2xl font-semibold">${comp}</div>
    </div>
    <div class="rounded-2xl bg-white shadow-sm p-4 border border-white">
      <div class="text-xs text-slate-500">En progreso</div>
      <div class="mt-1 text-2xl font-semibold">${prog}</div>
    </div>
    <div class="rounded-2xl bg-white shadow-sm p-4 border border-white">
      <div class="text-xs text-slate-500">Avance</div>
      <div class="mt-2 h-2 rounded-full bg-slate-200">
        <div class="h-2 rounded-full bg-brand-500" style="width:${pct}%"></div>
      </div>
      <div class="mt-1 text-sm text-slate-600">${pct}%</div>
    </div>`;
}

function cardTemplate(t) {
  const badge = (txt, color) => `<span class="rounded-full bg-${color}-50 text-${color}-700 text-[11px] px-2 py-0.5 border border-${color}-200">${txt}</span>`;
  const prColor = t.prioridad === 'ALTA' ? 'rose' : (t.prioridad === 'BAJA' ? 'emerald' : 'amber');
  return `
    <article class="task-card rounded-xl border border-slate-200 bg-white p-3 shadow-sm fade-in" data-id="${t.id}">
      <div class="flex items-start gap-2">
        <div class="mt-1 h-2 w-2 rounded-full ${t.estado==='COMPLETADA'?'bg-emerald-500':t.estado==='EN_PROGRESO'?'bg-amber-500':'bg-slate-300'}"></div>
        <h3 class="font-medium">${escapeHtml(t.titulo || '(Sin título)')}</h3>
        <div class="ms-auto flex items-center gap-1">${badge(t.prioridad, prColor)}</div>
      </div>
      ${t.descripcion ? `<p class="mt-1 text-sm text-slate-600">${escapeHtml(t.descripcion)}</p>` : ''}
      <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>${t.asignadoA ? '👤 '+escapeHtml(t.asignadoA) : ''}</span>
        <span>${t.fechaEntrega ? '📅 '+t.fechaEntrega : ''}</span>
      </div>
      <div class="mt-2 flex items-center gap-2">
        <button class="edit-btn rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] hover:bg-slate-200">Editar</button>
        <button class="del-btn rounded-lg bg-rose-50 px-2.5 py-1 text-[13px] text-rose-700 hover:bg-rose-100">Eliminar</button>
      </div>
    </article>`;
}

function columnTemplate(title, key, tareas) {
  return `
    <section class="kanban-col rounded-2xl p-3">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-sm font-semibold tracking-wide text-slate-700">${title}</h2>
        <span class="text-xs text-slate-500">${tareas.length}</span>
      </div>
      <div class="min-h-[120px] space-y-3" data-col="${key}"></div>
    </section>`;
}

function renderBoard() {
  const { texto, estado, prioridad } = state.filtros;
  const match = (t) => {
    const txt = (t.titulo + ' ' + t.descripcion + ' ' + t.asignadoA + ' ' + t.prioridad).toLowerCase();
    const okTxt = !texto || txt.includes(texto.toLowerCase());
    const okEst = !estado || t.estado === estado;
    const okPri = !prioridad || t.prioridad === prioridad;
    return okTxt && okEst && okPri;
  };

  const grouped = {
    PENDIENTE: [], EN_PROGRESO: [], COMPLETADA: []
  };
  state.tareas.filter(match).forEach(t => grouped[t.estado]?.push(t));

  $('#kanban').innerHTML = [
    columnTemplate('Pendiente', 'PENDIENTE', grouped.PENDIENTE),
    columnTemplate('En progreso', 'EN_PROGRESO', grouped.EN_PROGRESO),
    columnTemplate('Completada', 'COMPLETADA', grouped.COMPLETADA)
  ].join('');

  renderKpis(state.tareas.filter(match));
  $('#emptyState').classList.toggle('hidden', (grouped.PENDIENTE.length + grouped.EN_PROGRESO.length + grouped.COMPLETADA.length) > 0);

  // Pintar tarjetas
  for (const col of $$('#kanban [data-col]')) {
    const key = col.getAttribute('data-col');
    const list = grouped[key];
    col.innerHTML = list.map(cardTemplate).join('');
  }

  // Bind botones de tarjetas
  for (const el of $$('.task-card')) {
    el.querySelector('.edit-btn').addEventListener('click', () => openModal(el.dataset.id));
    el.querySelector('.del-btn').addEventListener('click', () => onDelete(el.dataset.id));
  }

  // Activar drag & drop con SortableJS
  activateDnD();
}

function activateDnD() {
  for (const col of $$('#kanban [data-col]')) {
    new Sortable(col, {
      group: 'tareas',
      animation: 150,
      ghostClass: 'card-dragging',
      onAdd: async (evt) => {
        const id = evt.item?.dataset?.id;
        const newEstado = evt.to?.dataset?.col;
        if (!id || !newEstado) return;
        const tarea = state.tareas.find(t => String(t.id) === String(id));
        if (!tarea) return;
        const prev = tarea.estado;
        try {
          tarea.estado = newEstado;
          await apiUpdate(id, tarea);
          toast('Estado actualizado');
        } catch (e) {
          tarea.estado = prev;
          toast('No se pudo actualizar el estado');
          renderBoard();
        }
      }
    });
  }
}

// ==============================
// Modal y CRUD
// ==============================
function openModal(id) {
  $('#taskModal').classList.remove('hidden');
  const isEdit = Boolean(id);
  $('#modalTitle').textContent = isEdit ? 'Editar tarea' : 'Nueva tarea';
  $('#deleteBtn').classList.toggle('hidden', !isEdit);

  if (isEdit) {
    const t = state.tareas.find(x => String(x.id) === String(id));
    if (!t) return;
    $('#taskId').value = t.id;
    $('#titulo').value = t.titulo || '';
    $('#descripcion').value = t.descripcion || '';
    $('#estado').value = t.estado || 'PENDIENTE';
    $('#prioridad').value = t.prioridad || 'MEDIA';
    $('#asignadoA').value = t.asignadoA || '';
    $('#fechaEntrega').value = t.fechaEntrega || '';
  } else {
    $('#taskId').value = '';
    $('#titulo').value = '';
    $('#descripcion').value = '';
    $('#estado').value = 'PENDIENTE';
    $('#prioridad').value = 'MEDIA';
    $('#asignadoA').value = '';
    $('#fechaEntrega').value = isoHoy();
  }
}

function closeModal() {
  $('#taskModal').classList.add('hidden');
}

async function onSubmit(e) {
  e.preventDefault();
  const payload = {
    id: $('#taskId').value || undefined,
    titulo: $('#titulo').value.trim(),
    descripcion: $('#descripcion').value.trim(),
    estado: $('#estado').value,
    prioridad: $('#prioridad').value,
    asignadoA: $('#asignadoA').value.trim(),
    fechaEntrega: $('#fechaEntrega').value
  };

  try {
    if (payload.id) {
      await apiUpdate(payload.id, payload);
      const i = state.tareas.findIndex(t => String(t.id) === String(payload.id));
      if (i >= 0) state.tareas[i] = { ...state.tareas[i], ...payload };
      toast('Tarea actualizada');
    } else {
      await apiCreate(payload);
      // Volver a pedir la lista para traer el ID generado
      state.tareas = await apiList();
      toast('Tarea creada');
    }
    closeModal();
    renderBoard();
  } catch (err) {
    console.error(err);
    toast('No se pudo guardar');
  }
}

async function onDelete(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  try {
    await apiDelete(id);
    state.tareas = state.tareas.filter(t => String(t.id) !== String(id));
    renderBoard();
    toast('Tarea eliminada');
  } catch (e) {
    toast('No se pudo eliminar');
  }
}

// ==============================
// Búsqueda y filtros
// ==============================
function bindFilters() {
  $('#searchInput').addEventListener('input', (e) => {
    state.filtros.texto = e.target.value;
    renderBoard();
  });
  $('#estadoFilter').addEventListener('change', (e) => {
    state.filtros.estado = e.target.value;
    renderBoard();
  });
  $('#prioridadFilter').addEventListener('change', (e) => {
    state.filtros.prioridad = e.target.value;
    renderBoard();
  });
}

// ==============================
// Helpers
// ==============================
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

// ==============================
// Inicialización
// ==============================
async function init() {
  bindFilters();

  $('#newTaskBtn').addEventListener('click', () => openModal());
  $('#closeModal').addEventListener('click', closeModal);
  $('#taskForm').addEventListener('submit', onSubmit);
  $('#refreshBtn').addEventListener('click', async () => {
    state.tareas = await apiList();
    renderBoard();
    toast('Actualizado');
  });
  $('#deleteBtn').addEventListener('click', () => {
    const id = $('#taskId').value;
    if (id) onDelete(id).then(closeModal);
  });

  try {
    state.tareas = await apiList();
  } catch (e) {
    console.error(e);
    toast('No se pudo conectar al backend /tareas');
  }
  renderBoard();
}

window.addEventListener('DOMContentLoaded', init);