const themeToggle = document.getElementById("theme-toggle");
const body = document.body;
const LS_KEY = "theme-preference";

function applyTheme(theme) {
    if (theme === "dark") {
    body.classList.add("dark-mode");
    themeToggle.checked = true;
} else {
    body.classList.remove("dark-mode");
    themeToggle.checked = false;
}
}

function getSavedTheme() {
    try {
    return localStorage.getItem(LS_KEY);
} catch (e) {
    return null;
}
}

function saveTheme(theme) {
    try {
    localStorage.setItem(LS_KEY, theme);
} catch (e) { /* ignore */ }
}

document.addEventListener("DOMContentLoaded", () => {
    const saved = getSavedTheme();
    if (saved) {
    applyTheme(saved);
} else {
    applyTheme("light");
}
});

themeToggle.addEventListener("change", (e) => {
    const newTheme = e.target.checked ? "dark" : "light";
    applyTheme(newTheme);
    saveTheme(newTheme);
});

// ---- Rick & Morty API ----
// Elementos del DOM 
const form = document.getElementById("formulario");
const inputNombre = document.getElementById("nombre-personaje");
const selectEstados = document.getElementById("estados");
const resultsContainer = document.getElementById("results");
const limpiarBtn = document.getElementById("btn-limpiar");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageInfo = document.getElementById("page-info");

// Estado de la UI
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";  
let currentStatus = "0"; 

const statusMap = {
    "0": "",     
    "1": "alive",
    "2": "dead",
    "3": "unknown"
};

const API_BASE = "https://rickandmortyapi.com/api/character/";

function buildUrl(page = 1, name = "", statusKey = "0") {
    const url = new URL(API_BASE);
    url.searchParams.set("page", page);
    if (name && name.trim() !== "") url.searchParams.set("name", name.trim());
    const status = statusMap[statusKey];
    if (status) url.searchParams.set("status", status);
    return url.toString();
}
inputNombre.addEventListener("input", () => {
    if (inputNombre.value.trim() !== "") {
        limpiarBtn.style.display = "block";
    } else {
        limpiarBtn.style.display = "none";
    }
});
limpiarBtn.addEventListener("click", () => {
    // limpiar el input
    inputNombre.value = "";

    // ocultar el botón
    limpiarBtn.style.display = "none";

    // Resetear la búsqueda, pero SIN cambiar el estado
    currentQuery = "";
    currentPage = 1;

    // Mostrar personajes desde la página 1 con el estado actual seleccionado
    fetchCharacters(currentPage, currentQuery, currentStatus);
});

function createCard(person) {
    // Crear la tarjeta
    const card = document.createElement("article");
    card.classList.add("card");

    // Imagen
    const img = document.createElement("img");
    img.src = person.image;
    img.alt = person.name;

    // Contenedor de información
    const info = document.createElement("div");
    info.classList.add("info");

    // Título
    const title = document.createElement("h3");
    title.textContent = person.name;

    // Especie + género
    const species = document.createElement("p");
    species.textContent = `Especie: ${person.species} — Genero: ${person.gender}`;

    // Estado + origen
    const status = document.createElement("p");
    status.textContent = `Estado: ${person.status} • Origen: ${person.origin?.name || "Desconocido"}`;

    // Insertar elementos dentro del contenedor
    info.appendChild(title);
    info.appendChild(species);
    info.appendChild(status);

    // Insertar imagen + info dentro de la tarjeta
    card.appendChild(img);
    card.appendChild(info);

    return card;
}

// Mostrar un estado de carga simple
function setLoading(isLoading) {
    resultsContainer.innerHTML = "";
    if (isLoading) {
    const p = document.createElement("p");
    p.textContent = "Cargando...";
    resultsContainer.appendChild(p);
    }
}

// Mostrar mensaje (error o no resultados)
function showMessage(msg) {
    resultsContainer.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = msg;
    resultsContainer.appendChild(p);
}

// Actualizar controles de paginación
function updatePaginationControls() {
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function renderResults(characters) {
    resultsContainer.innerHTML = "";  

    characters.forEach(person => {
        const card = createCard(person);
        resultsContainer.appendChild(card);
    });
}

// Lógica principal: buscar en la API
async function fetchCharacters(page = 1, name = "", statusKey = "0") {
    setLoading(true);
    const url = buildUrl(page, name, statusKey);

    try {
    const res = await fetch(url);
    if (!res.ok) {
      // La API devuelve 404 cuando no hay resultados -> lo manejamos aparte
        if (res.status === 404) {
            totalPages = 1;
            currentPage = 1;
            updatePaginationControls();
            showMessage("No se encontraron personajes.");
            return;
        } else {
        throw new Error(`HTTP ${res.status}`);
        }
    }

    const data = await res.json();
    // data.info -> { count, pages, next, prev }
    // data.results -> array de personajes
    totalPages = data.info?.pages || 1;
    currentPage = page;
    updatePaginationControls();

    if (Array.isArray(data.results) && data.results.length > 0) {
        renderResults(data.results);
    } else {
        showMessage("No se encontraron personajes.");
    }
    } catch (error) {
    console.error("Fetch error:", error);
    showMessage("Ocurrió un error al consultar la API. Intenta de nuevo.");
    }
}

// ---- Eventos UI: búsqueda, filtro y paginación ----

// Cuando se envía el formulario (buscar por nombre)
form.addEventListener("submit", (e) => {
    e.preventDefault();
    currentQuery = inputNombre.value;
    currentStatus = selectEstados.value;
  currentPage = 1; // iniciar desde la primera página en una nueva búsqueda
    fetchCharacters(currentPage, currentQuery, currentStatus);
});

// Cuando cambias el filtro de estado
selectEstados.addEventListener("change", () => {
    currentStatus = selectEstados.value;
    currentPage = 1;
    fetchCharacters(currentPage, currentQuery, currentStatus);
});

// Paginar: anterior
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage -= 1;
        fetchCharacters(currentPage, currentQuery, currentStatus);
    }
});

// Paginar: siguiente
nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage += 1;
        fetchCharacters(currentPage, currentQuery, currentStatus);
    }
});

// Búsqueda inicial: carga la primera página sin filtros
document.addEventListener("DOMContentLoaded", () => {
  // También inicializamos el estado de controles de paginación
    updatePaginationControls();
    fetchCharacters(currentPage, currentQuery, currentStatus);
});
