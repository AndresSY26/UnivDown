// public/js/erome.public.js

// ===========================================================
// --- HELPER _t (Función externa/global para este script) ---
// ===========================================================
function _t(key, defaultValue) {
    try {
        return window.i18next && window.i18next.isInitialized ? window.i18next.t(key, { defaultValue }) : defaultValue;
    } catch(e) {
        console.warn('i18next translation helper error:', e);
        return defaultValue;
    }
}

// ===========================================================
// --- Funciones Auxiliares UI Externas ---
// ===========================================================
/** Muestra error (busca elementos cada vez). */
function showError(message) {
    const infoSection = document.getElementById('erome-info-section'); // << ID Erome
    const errorContainer = document.getElementById('error-container');
    const urlInput = document.getElementById('url-input');      // << ID Genérico Erome

    if (infoSection) { infoSection.classList.add('hidden'); }
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.className = 'error-message visible';
        errorContainer.style.display = "block";
    } else { console.error("Error container #error-container not found.", message); }
    if (urlInput) { urlInput.classList.add("error-input"); }
}

/**
 * Maneja clics en botones de descarga dentro de #media-list para Erome.
 * @param {Event} event
 */
async function handleEromeDownloadClick(event) {
    const downloadButton = event.target.closest('.Download');
    if (!downloadButton) return;

    event.preventDefault();
    event.stopPropagation(); // Prevenir que el click llegue al modal si el botón está sobre imagen/video

    if(downloadButton.disabled) { console.warn("Download button already disabled."); return; }

    const urlToDownload = decodeURIComponent(downloadButton.dataset.url);
    const filename = decodeURIComponent(downloadButton.dataset.filename);

    if (!urlToDownload || !filename) {
        console.error("Missing URL or filename for download:", downloadButton.dataset);
        showError(_t('error_download_data_missing', 'Download data missing. Cannot proceed.'));
        return;
    }

    downloadButton.disabled = true;
    const originalText = downloadButton.innerHTML;
    let downloadingText = _t('PreparingDownload', { defaultValue: "Preparing..."});
    downloadButton.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${downloadingText}`;

    try {
        // Construye la URL del backend (usa el endpoint correcto)
        const backendDownloadUrl = `/erome/download?url=${encodeURIComponent(urlToDownload)}&filename=${encodeURIComponent(filename)}`;
        console.log("Initiating Erome download via backend:", backendDownloadUrl);

        const tempLink = document.createElement('a');
        tempLink.href = backendDownloadUrl;
        tempLink.setAttribute('download', filename);
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);

        setTimeout(() => {
            if (downloadButton.disabled) { // Evitar restaurar si hubo error rápido
               downloadButton.innerHTML = originalText;
               downloadButton.disabled = false;
            }
        }, 1500); // Tiempo un poco más corto para Erome, tal vez?

    } catch (error) {
        console.error('Error initiating Erome download link:', error);
        let errorDownloadText = _t('error_download_setup_failed', { defaultValue: "Error" });
        downloadButton.innerHTML = `<i class="ri-error-warning-line"></i> ${errorDownloadText}`;
        showError(_t('error_download_initiation', 'Could not prepare download. Please check console or try again.')); // <-- Usa showError global
        setTimeout(() => {
            if(downloadButton.disabled) { // Evitar restaurar si hubo error rápido
                downloadButton.innerHTML = originalText;
                downloadButton.disabled = false;
            }
        }, 3000);
    }
}

// ===========================================================
// --- INICIALIZADOR PÁGINA EROME ---
// ===========================================================
function initEromePage() {
    // --- 1. Buscar elementos DOM ---
    // Usamos los IDs genéricos del HTML de Erome original
    const urlInput_init = document.getElementById("url-input");
    const getVideosButton_init = document.getElementById("GetVideos");
    const errorContainer_init = document.getElementById("error-container");
    const mediaList_init = document.getElementById("media-list");
    const infoSection_init = document.getElementById('erome-info-section');

    // --- 2. Guardia: Verificar elementos ---
    if (!urlInput_init || !getVideosButton_init || !errorContainer_init || !mediaList_init || !infoSection_init) { // <<< Añadido infoSection
        console.error("❌ Erome page elements not found during initialization. Aborting setup. Check erome.ejs IDs.");
        return;
    }

    // --- 3. Funciones Internas ---
    /** Limpia resultados y errores. */
    function clearResults_internal() {
        if (mediaList_init) mediaList_init.innerHTML = "";
        if (errorContainer_init) {
            errorContainer_init.textContent = "";
            errorContainer_init.className = 'error-message';
            errorContainer_init.style.display = "none";
        }
        if (urlInput_init) urlInput_init.classList.remove("error-input");
        // Decide si mostrar la info de nuevo
        // if (infoSection_init && !errorContainer_init.textContent && !urlInput_init.value) {
        //    infoSection_init.classList.remove('hidden');
        // }
    }

     /** Muestra estado de carga. */
    function showLoading_internal(text) {
        if (getVideosButton_init) {
            getVideosButton_init.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${text}`;
            getVideosButton_init.disabled = true;
        }
        if (urlInput_init) urlInput_init.disabled = true;
    }

     /** Oculta estado de carga. */
    function hideLoading_internal(text) {
        if (getVideosButton_init) {
            getVideosButton_init.textContent = text;
            getVideosButton_init.disabled = false;
        }
        if (urlInput_init) urlInput_init.disabled = false;
    }

    /** Muestra resultados del fetch. */
    function displayMediaResult(data) {
        // Ocultar info al mostrar resultados
        if (infoSection_init && !infoSection_init.classList.contains('hidden')) {
            infoSection_init.classList.add('hidden');
        }
        if (!mediaList_init) return;
        mediaList_init.innerHTML = '';

        let downloadVideoText = _t('DownloadVideo', { defaultValue: "Download Video" });
        let downloadImageText = _t('DownloadImage', { defaultValue: "Download Image" });

        if (data && Array.isArray(data) && data.length > 0) {
            data.forEach((item) => {
                const element = document.createElement("div");
                element.classList.add("media-item");

                if (item.type === "video" && item.url) {
                    element.classList.add("video-item");
                    const filename = item.filename || 'erome_video.mp4';
                    element.innerHTML = `
                       <video preload="metadata" poster="${item.thumbnail || ''}">
                           <source src="${item.url}" type="video/mp4">
                       </video>
                       <i class="ri-play-circle-fill video-play-icon"></i>
                       <button class="Download" data-url="${encodeURIComponent(item.url)}" data-filename="${encodeURIComponent(filename)}">
                           ${downloadVideoText} <i class="ri-download-2-line"></i>
                       </button>`;
                } else if (item.type === "image" && item.url) {
                    element.classList.add("image-item");
                    const thumb = item.thumbnail || item.url;
                    const fullUrl = item.url;
                    const filename = item.filename || 'erome_image.jpg';
                    element.innerHTML = `
                      <img src="${thumb}" alt="Erome Image Thumbnail" loading="lazy" data-full-url="${fullUrl}">
                      <button class="Download" data-url="${encodeURIComponent(fullUrl)}" data-filename="${encodeURIComponent(filename)}">
                          ${downloadImageText} <i class="ri-download-2-line"></i>
                       </button>`;
                } else {
                    console.warn("Skipping invalid Erome media item:", item);
                    return;
                }
                mediaList_init.appendChild(element);
            });
        } else {
            // Llama a showError si no hay resultados válidos
             let errorNoMediaText = _t('error_no_media', { defaultValue: "No media found or the album might be private/invalid." });
             showError(errorNoMediaText);
        }
    }


    // --- 4. Listener Botón "Get visuals" ---
     // Limpiar listener clonando
     const old_button = getVideosButton_init;
     if (!old_button.parentNode) {
         console.warn("Erome GetVideosButton parent not found.");
     } else {
         const new_button = old_button.cloneNode(true);
         old_button.parentNode.replaceChild(new_button, old_button);

         new_button.addEventListener("click", async () => {
            const url = urlInput_init.value.trim();
            clearResults_internal();

            if (!url) {
                 // Usa el helper _t directamente o a través de showError
                 showError(_t('error_erome_url_empty', { defaultValue: "Please enter an Erome URL." }));
                 return;
             }
             // Validación básica - se puede mejorar
             if (!url.includes('erome.com/a/')) {
                 showError(_t('error_erome_url_invalid', {defaultValue: 'Please enter a valid Erome album URL.'}));
                 return;
             }


            if (infoSection_init) infoSection_init.classList.add('hidden');

            let fetchingText = _t('Fetching', { defaultValue: "Fetching..." });
            let getVisualsText = _t('GetVideos', { defaultValue: "Get visuals" });
            const originalButtonText = new_button.textContent;
            showLoading_internal(fetchingText);

            try {
                const response = await fetch("/erome/fetch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });
                const data = await response.json();

                if (!response.ok) { throw new Error(data.error || `Server Error: ${response.status}`); }

                displayMediaResult(data); // Llama a la interna para mostrar resultados

            } catch (error) {
                console.error("Fetch/Processing Error (Erome):", error);
                 showError(`${_t('Error', 'Error')}: ${error.message}`); // Llama a global
            } finally {
                hideLoading_internal(originalButtonText || getVisualsText); // Usa interna
            }
         });
     }


    // --- 5. Listener Descargas (Delegación + Limpieza) ---
    if (mediaList_init) {
        // Quitar listener anterior (global) antes de añadirlo
        mediaList_init.removeEventListener('click', handleEromeDownloadClick);
        // Añadir el listener (global)
        mediaList_init.addEventListener('click', handleEromeDownloadClick);
    } else {
         console.error("Erome mediaList not found, cannot attach download listener.");
    }

}; // === Fin de initEromePage ===


// ===========================================================
// --- REGISTRO PARA EL ROUTER SPA (AL FINAL) ---
// ===========================================================
window.pageInitializers = window.pageInitializers || {};
window.pageInitializers.erome = initEromePage;