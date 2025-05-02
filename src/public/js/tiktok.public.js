// public/js/tiktok.public.js
function initTikTokPage() {
    // --- Referencias Elementos DOM ---
    const urlInput = document.getElementById("url-input-tiktok");
    const getVideosButton = document.getElementById("GetVideosTikTok");
    const mediaListContainer = document.getElementById("media-list");
    const errorContainer = document.getElementById("error-container");

    // --- Helper para obtener traducciones ---
    function _t(key, defaultValue) {
        try {
            // Asegúrate de que i18next esté inicializado y cargado
            if (window.i18next && window.i18next.isInitialized) {
                return window.i18next.t(key, { defaultValue });
            }
        } catch (e) {
            console.warn(`i18next error for key "${key}":`, e);
        }
        return defaultValue;
    }

    // ===========================================================
    // --- DEFINICIONES DE FUNCIONES AUXILIARES (LA SOLUCIÓN) ---
    // Estas funciones deben estar definidas dentro del scope del DOMContentLoaded
    // ===========================================================

    function showError(message) {
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = "block";
        } else {
            console.error("Error container not found. Message:", message);
        }
    }

    function clearResults() {
        if (mediaListContainer) mediaListContainer.innerHTML = "";
        if (errorContainer) {
            errorContainer.textContent = "";
            errorContainer.style.display = "none";
        }
    }

    function showLoading(text = "Loading...") {
        if (getVideosButton) {
             // Usa el texto proporcionado (que ya intentó obtener la traducción)
             getVideosButton.textContent = text;
             getVideosButton.disabled = true;
        }
       if (urlInput) urlInput.disabled = true;
    }

    function hideLoading(text = "Get videos") {
       if (getVideosButton) {
           // Usa el texto proporcionado (que ya intentó obtener la traducción)
           getVideosButton.textContent = text;
           getVideosButton.disabled = false;
       }
        if (urlInput) urlInput.disabled = false;
    }
    // ===========================================================
    // --- FIN DE DEFINICIONES DE FUNCIONES AUXILIARES ---
    // ===========================================================

    // --- Listener 'Get videos' (Fetch) ---
    if (getVideosButton) {
        getVideosButton.addEventListener("click", async () => {
            const url = urlInput.value.trim();
            clearResults(); // Llama a la función definida arriba
            urlInput.classList.remove("error-input");

            if (!url) {
                showError(_t('error_tiktok_url_empty', "Please enter a TikTok URL."));
                urlInput.classList.add("error-input");
                return;
            }

            // Obtener textos ANTES de llamar a showLoading/hideLoading
            const fetchingText = _t('Fetching', "Fetching...");
            const getVideosText = _t('GetVideosTikTok', "Get videos");

            // *** AQUÍ es donde se llama a showLoading ***
            showLoading(fetchingText);

            try {
                const response = await fetch("/api/tiktok/info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Usar mensaje del servidor o genérico traducido
                     throw new Error(data.message || _t('error_server_generic', `Server Error: ${response.status}`));
                }

                if (data.status === 'success' && data.videoUrl) {
                    // LLAMADA A LA FUNCIÓN displayMediaResult (SIN CAMBIOS en esta parte)
                    displayMediaResult(data);
                } else if (data.status === 'error') {
                    throw new Error(data.message || _t('error_api_unknown_tiktok', 'Could not retrieve video details.'));
               } else {
                    // Caso improbable si la API backend funciona correctamente
                    throw new Error(_t('error_api_unexpected_tiktok', 'Unexpected response structure from server.'));
                }

            } catch (error) {
                console.error("Fetch/Processing Error:", error);
                // Muestra el error usando la función auxiliar
                 showError(`${_t('Error', 'Error')}: ${error.message}`);
                 urlInput.classList.add('error-input');
            } finally {
                // *** AQUÍ es donde se llama a hideLoading ***
                 hideLoading(getVideosText);
            }
        });
    } else {
        console.error("Button #GetVideosTikTok not found");
    }

    // --- Función para Mostrar Resultados (SIN CAMBIOS RESPECTO A TU ÚLTIMA VERSIÓN) ---
    function displayMediaResult(mediaData) {
        mediaListContainer.innerHTML = '';

        const mediaItem = document.createElement('div');
        mediaItem.classList.add('media-item', 'video-item', 'media-item-tiktok');
        mediaItem.style.cursor = 'pointer'; // Cursor para indicar clic

        // --- Texto Botón Descarga ---
        const downloadButtonText = _t('DownloadVideoHD', "Download HD");

        // Thumbnail (Imagen Clicable para ABRIR VIDEO MODAL)
        const thumbnail = document.createElement('img');
        const thumbnailUrl = mediaData.thumbnailUrl || '/img/default-tiktok-thumbnail.png';
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = 'TikTok Video Thumbnail - Click to play';
        thumbnail.classList.add('tiktok-thumbnail');
        thumbnail.onerror = () => {
            thumbnail.src = '/img/default-tiktok-thumbnail.png';
            console.warn("Thumbnail failed to load, using default.");
        };

        // Listener en el CONTENEDOR para abrir video (SIN CAMBIOS)
        mediaItem.addEventListener('click', (event) => {
             if (event.target.closest('.Download')) { return; }
             if (window.openVideoModal) {
                 window.openVideoModal(mediaData.videoUrl);
             } else { 
                console.error("openVideoModal function not found. Make sure it's defined globally in media-ui.public.js");
                // Fallback muy básico (no recomendado para producción sin más lógica)
                const videoModalDirect = document.getElementById('videoModal');
                const modalVideoDirect = document.getElementById('modalVideo');
                if(videoModalDirect && modalVideoDirect) {
                   console.warn("Attempting direct modal open as fallback.")
                   modalVideoDirect.src = mediaData.videoUrl;
                   videoModalDirect.classList.add("modal-visible");
                   document.body.classList.add("modal-open");
                }
              }
        });

        // --- Botones ---
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('tiktok-button-container', 'media-button-container');

        // Botón de Descarga (SIN CAMBIOS)
        const downloadButton = document.createElement('button');
        downloadButton.classList.add('tiktok-download-button', 'Download');
        downloadButton.innerHTML = `${downloadButtonText} <i class="ri-download-2-line"></i>`;
        downloadButton.dataset.url = encodeURIComponent(mediaData.videoUrl);
        const filenameBase = mediaData.author?.unique_id || mediaData.author?.nickname || 'tiktok_video';
        const filename = `${filenameBase}_${Date.now()}.mp4`;
        downloadButton.dataset.filename = encodeURIComponent(filename);

        // Añadir elementos (SIN CAMBIOS)
        mediaItem.appendChild(thumbnail);
        buttonContainer.appendChild(downloadButton);
        mediaItem.appendChild(buttonContainer);

        mediaListContainer.appendChild(mediaItem);
    }

    // --- Listener para Botón de Descarga (SIN CAMBIOS RESPECTO A TU ÚLTIMA VERSIÓN) ---
    mediaListContainer.addEventListener('click', async (event) => {
        const downloadButton = event.target.closest('.Download');
        if (!downloadButton) return;

        event.preventDefault();
        event.stopPropagation();

        const urlToDownload = decodeURIComponent(downloadButton.dataset.url);
        const filename = decodeURIComponent(downloadButton.dataset.filename);

        downloadButton.disabled = true;
        const originalText = downloadButton.innerHTML;
        const downloadingText = _t('PreparingDownload', "Preparing...");
        downloadButton.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${downloadingText}`;

        try {
            const backendDownloadUrl = `/api/tiktok/download?url=${encodeURIComponent(urlToDownload)}&filename=${encodeURIComponent(filename)}`;
            const tempLink = document.createElement('a');
            tempLink.href = backendDownloadUrl;
            tempLink.setAttribute('download', filename);
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);

            setTimeout(() => {
                downloadButton.innerHTML = originalText;
                downloadButton.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error initiating download link:', error);
            const errorDownloadText = _t('error_download_setup_failed', "Error");
            downloadButton.innerHTML = `<i class="ri-error-warning-line"></i> ${errorDownloadText}`;
            setTimeout(() => {
                downloadButton.innerHTML = originalText;
                downloadButton.disabled = false;
            }, 3000);
        }
    });
};

// --- Fallback para Carga Directa ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTikTokPage);
} else {
    // --- Disponibilidad Global ---
    window.pageInitializers = window.pageInitializers || {};
    window.pageInitializers.tiktok = initTikTokPage;
}