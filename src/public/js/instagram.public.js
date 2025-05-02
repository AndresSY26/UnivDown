// public/js/instagram.public.js

// ===========================================================
// --- HELPER _t (Función externa/global para este script) ---
// ===========================================================
/**
 * Helper para obtener traducciones usando i18next si está disponible.
 * @param {string} key - La clave de traducción.
 * @param {string} defaultValue - El valor a retornar si la clave no se encuentra o i18next no está listo.
 * @returns {string} La cadena traducida o el valor por defecto.
 */
function _t(key, defaultValue) {
    try {
        // Ensure i18next is initialized and ready
        return window.i18next && window.i18next.isInitialized ? window.i18next.t(key, { defaultValue }) : defaultValue;
    } catch(e) {
        console.warn('i18next translation helper error:', e);
        return defaultValue;
    }
}

// ===========================================================
// --- Funciones Auxiliares UI Externas ---
// Buscan sus elementos DOM cada vez que se llaman (SPA compatible)
// ===========================================================

/**
 * Muestra un mensaje de error en el contenedor designado y oculta la sección de información.
 * Busca los elementos necesarios cada vez.
 * @param {string} message - El mensaje de error a mostrar.
 */
function showError(message) {
    // Busca elementos relevantes cada vez
    const infoSection = document.getElementById('instagram-info-section'); // << Busca ID de Instagram
    const errorContainer = document.getElementById('error-container');
    const urlInput = document.getElementById('url-input-instagram');      // << Busca ID de Instagram

    if (infoSection) { infoSection.classList.add('hidden'); } // Oculta sección info en error
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.className = 'error-message visible'; // <- Clase de error
        errorContainer.style.display = "block";
    } else { console.error("Error container #error-container not found when trying to show error.", message); }
    if (urlInput) { urlInput.classList.add("error-input"); }
}

/**
 * Muestra un mensaje informativo/aviso en el contenedor designado y oculta la sección de información.
 * Busca los elementos necesarios cada vez.
 * @param {string} message - El mensaje informativo a mostrar.
 */
function showNotice(message) {
     // Busca elementos relevantes cada vez
    const infoSection = document.getElementById('instagram-info-section'); // << Busca ID de Instagram
    const errorContainer = document.getElementById('error-container'); // Usamos el mismo div
    const urlInput = document.getElementById('url-input-instagram');      // << Busca ID de Instagram

    if (infoSection) { infoSection.classList.add('hidden'); } // Oculta sección info intro
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.className = 'info-message visible'; // <- Clase de aviso/info
        errorContainer.style.display = "block";
    } else { console.warn("Message container #error-container not found.", message); }
    // No marcar input como error para un aviso
    if (urlInput) { urlInput.classList.remove("error-input"); }
}


// ===========================================================
// --- INICIALIZADOR PÁGINA INSTAGRAM ---
// Esta es la función que el router SPA (index.public.js) llamará.
// ===========================================================
function initInstagramPage() {

    // --- 1. Buscar elementos DOM específicos de Instagram ---
    const urlInput_init = document.getElementById('url-input-instagram');
    const getVideosButton_init = document.getElementById('GetVideosInstagram');
    const mediaListContainer_init = document.getElementById('media-list');
    const errorContainer_init = document.getElementById('error-container'); // El contenedor de errores/avisos
    const infoSection_init = document.getElementById('instagram-info-section'); // La sección de información

    // --- 2. Guardia: Salir si falta algo esencial ---
    if (!urlInput_init || !getVideosButton_init || !mediaListContainer_init || !errorContainer_init || !infoSection_init) {
        console.error("❌ Instagram page elements not found during initialization. Aborting setup for this page load. Check instagram.ejs partial and element IDs.");
        return;
    }

    // --- 3. Funciones Auxiliares Internas ---
    //    Operan sobre los elementos _init encontrados

    /** Limpia resultados, errores/avisos y el estado de error del input. */
    function clearResults_internal() {
        if (mediaListContainer_init) {
            mediaListContainer_init.innerHTML = "";
        }
        if (errorContainer_init) {
            errorContainer_init.textContent = "";
            errorContainer_init.className = 'error-message'; // Reset a la clase base (oculta)
            errorContainer_init.style.display = "none";
        }
        if (urlInput_init) {
            urlInput_init.classList.remove("error-input");
        }
         // Opcionalmente, podríamos querer mostrar la sección de información de nuevo
        // if (infoSection_init && !errorContainer_init.textContent && !urlInput_init.value.trim()) {
        //     infoSection_init.classList.remove('hidden');
        // }
    }

    // --- Nota: No necesitamos show/hideLoading o displayResults todavía ---
    //       Pero los placeholders podrían ser útiles si desarrollas esto más tarde.
    /*
    function showLoading_internal(text) { ... }
    function hideLoading_internal(text) { ... }
    function displayMediaResults_internal(mediaArray) { ... }
    */


    // --- 4. Listener Botón "Get Videos" ---
    // Limpiar listeners anteriores (Clonación)
    const old_button = getVideosButton_init;
    if (!old_button.parentNode) {
        console.warn("Instagram GetVideosButton parentNode not found. Cannot attach listener.");
    } else {
        const new_button = old_button.cloneNode(true);
        old_button.parentNode.replaceChild(new_button, old_button);

        // Adjuntar el listener al NUEVO botón
        new_button.addEventListener('click', async () => {
            clearResults_internal(); // Limpia cualquier error/aviso/resultado previo
            const urlValue = urlInput_init.value.trim(); // Obtiene valor actual del input

            // Validación simple de URL
            if (!urlValue) {
                showError(_t('error_instagram_url_empty', 'Please enter an Instagram URL.'));
                return;
            }
            // Podría mejorarse con regex, pero busca la base
            if (!urlValue.includes('instagram.com/')) {
                showError(_t('error_instagram_url_invalid', 'Please enter a valid Instagram Post or Reel URL.'));
                return;
            }

            // === >>> LÓGICA ACTUAL: Mostrar mensaje "Under Development" <<< ===
            // 1. Ocultar la sección de info principal
            if (infoSection_init) {
                infoSection_init.classList.add('hidden');
                console.log("Hiding info section to show notice."); // Log
            }
            // 2. Mostrar el aviso
            const devMessage = _t('instagram_under_development', 'Instagram feature is currently under development.');
            showNotice(devMessage); // Usar la función global showNotice
            console.log("Displayed 'Under Development' notice."); // Log
            // 3. Detener aquí ya que la función no está lista
            return;
            // =================================================================

            /* // === CÓDIGO FUTURO PARA CUANDO ESTÉ LISTO ===
            // 1. Ocultar la info section
            if (infoSection_init) infoSection_init.classList.add('hidden');
            // 2. Mostrar estado de carga
            const fetchingText = _t('Fetching', "Fetching...");
            const originalButtonText = new_button.textContent;
            // showLoading_internal(fetchingText); // Necesitaría show/hide loading interno

            try {
                 // 3. Llamar a la API backend
                 console.log(`Fetching Instagram info for URL: ${urlValue}`);
                 const response = await fetch("/api/instagram/info", { // Asume este endpoint futuro
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ url: urlValue }),
                 });
                 const data = await response.json();

                 // 4. Procesar respuesta
                 if (!response.ok || !data.success) {
                     throw new Error(data.message || `Server responded with status ${response.status}`);
                 }
                 console.log("Instagram data received:", data);
                 // displayMediaResults_internal(data.media || data.data); // Llama a tu función para mostrar resultados
                 if (!data.media || data.media.length === 0) {
                    showNotice("No downloadable media found for this Instagram URL.");
                 }

            } catch (error) {
                 console.error("Fetch/Processing Error (Instagram):", error);
                 showError(`${_t('Error', 'Error')}: ${error.message}`); // Llama a showError global
            } finally {
                 // 5. Ocultar estado de carga
                 // hideLoading_internal(originalButtonText || _t('GetVideosInstagram', 'Get videos'));
            }
            */ // === FIN CÓDIGO FUTURO ===
        });
    }


    // --- 5. Listener para Descargas (Futuro) ---
    // No es necesario ahora, ya que no se generan resultados descargables.
    // Si implementas resultados, necesitarás un manejador (handleInstagramDownloadClick)
    // y adjuntar/limpiar el listener en mediaListContainer_init aquí.
    /*
    if (mediaListContainer_init) {
        mediaListContainer_init.removeEventListener('click', handleInstagramDownloadClick);
        mediaListContainer_init.addEventListener('click', handleInstagramDownloadClick);
        console.log("Instagram Download click listener (placeholder) attached.");
    }
    */

} // === Fin de initInstagramPage ===


// ===========================================================
// --- REGISTRO PARA EL ROUTER SPA (DEBE ESTAR AL FINAL) ---
// ===========================================================
window.pageInitializers = window.pageInitializers || {};
window.pageInitializers.instagram = initInstagramPage;