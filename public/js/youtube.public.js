// public/js/youtube.public.js
function initYouTubePage() {
    // --- Referencias Elementos DOM ---
    const urlInput = document.getElementById("url-input-youtube");
    const getVideosButton = document.getElementById("GetVideosYoutube");
    const mediaListContainer = document.getElementById("media-list");
    const errorContainer = document.getElementById("error-container");

    getVideosButton.addEventListener("click", async () => {
        // 1. Limpiar
        errorContainer.textContent = '';
        mediaListContainer.innerHTML = '';

        // 2. Mensaje
        const developmentMessage = "En estos momentos se encuentra en desarrollo.";

        // 3. Crear elemento
        const messageElement = document.createElement('p');
        messageElement.textContent = developmentMessage;

        // --- Aplicar Clase y Estilos de Layout ---
        messageElement.classList.add('development-notice'); // <--- NUEVA CLASE AÑADIDA
        messageElement.style.marginTop = '2em'; // Mantenemos layout aquí (opcional)
        messageElement.style.gridColumn = '1 / -1'; // Mantenemos layout aquí (opcional)

        // --- ESTILOS VISUALES (color, fondo, borde) - ELIMINADOS DE AQUÍ ---
        // messageElement.style.padding = '15px'; // Lo moveremos a CSS
        // messageElement.style.textAlign = 'center'; // Lo moveremos a CSS
        // messageElement.style.color = '#ccc'; // ELIMINADO
        // messageElement.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; // ELIMINADO
        // messageElement.style.borderRadius = '8px'; // Lo moveremos a CSS
        // messageElement.style.border = '1px solid rgba(255, 255, 255, 0.1)'; // ELIMINADO
        // messageElement.style.fontSize = '1rem'; // Lo moveremos a CSS


        // 4. Añadir al DOM
        mediaListContainer.appendChild(messageElement);

        // Asegura que el contenedor tenga display grid (si no está garantizado por CSS)
        mediaListContainer.style.display = 'grid';

        // ... (Lógica futura)
    });
};

// --- Fallback para Carga Directa ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYouTubePage);
} else {
    // --- Disponibilidad Global ---
    window.pageInitializers = window.pageInitializers || {};
    window.pageInitializers.youtube = initYouTubePage;
}