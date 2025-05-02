// public/js/youtube.public.js

// ===========================================================
// --- HELPER PARA TRADUCCIONES (Ámbito del script) ---
// Puede ser llamado desde cualquier función en este archivo.
// ===========================================================
/**
 * Helper para obtener traducciones usando i18next si está disponible.
 * @param {string} key - La clave de traducción.
 * @param {string} defaultValue - El valor a retornar si la clave no se encuentra o i18next no está listo.
 * @returns {string} La cadena traducida o el valor por defecto.
 */
function _t(key, defaultValue) {
    try {
        if (window.i18next && window.i18next.isInitialized) {
            return window.i18next.t(key, { defaultValue });
        }
    } catch (e) {
        console.warn('i18next translation helper error:', e);
    }
    return defaultValue;
}

// ===========================================================
// --- FUNCIONES AUXILIARES DE UI (Ámbito del script) ---
// Encuentran sus elementos DOM necesarios cada vez que son llamadas.
// ===========================================================

/**
 * Muestra un mensaje de error en el contenedor designado y oculta la sección de información.
 * Busca los elementos necesarios cada vez para ser compatible con SPA.
 * @param {string} message - El mensaje de error a mostrar.
 */
function showError(message) {
    // Busca elementos cada vez
    const infoSection = document.getElementById('youtube-info-section');
    const errorContainer = document.getElementById('error-container');
    const urlInput = document.getElementById('url-input-youtube'); // Para marcar el input

    if (infoSection) { infoSection.classList.add('hidden'); }
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = "block";
        errorContainer.className = 'error-message visible';
    } else { console.error("Error container #error-container not found when trying to show error.", message); }
    if (urlInput) { urlInput.classList.add("error-input"); }
}

/**
 * Prepara y dispara la solicitud de descarga al backend proxy.
 * Ahora pasa el videoId (o URL completa) y el itag.
 * @param {string} videoIdentifier - La URL original de YouTube o el video ID.
 * @param {string} itag - El itag del formato seleccionado.
 * @param {string} filename - El nombre de archivo sugerido.
 * @param {HTMLButtonElement} buttonElement - El botón clickeado.
 */
async function triggerDownload(videoIdentifier, itag, filename, buttonElement) {
    // Asegurarse de que buttonElement es válido
    if (!buttonElement || !(buttonElement instanceof HTMLButtonElement)) {
        console.error("triggerDownload called with invalid buttonElement:", buttonElement);
        return;
    }
   const originalButtonContent = buttonElement.innerHTML;
   const downloadingText = _t('PreparingDownload', "Preparing...");
   buttonElement.disabled = true;
   buttonElement.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${downloadingText}`;

   console.log(`triggerDownload called for: itag ${itag}, filename: ${filename}`);

   try {
        // --- CONSTRUYE LA NUEVA URL DEL BACKEND ---
        // Pasamos la URL original (o ID) y el itag
       const backendDownloadUrl = `/api/youtube/download?videoUrl=${encodeURIComponent(videoIdentifier)}&itag=${encodeURIComponent(itag)}&filename=${encodeURIComponent(filename)}`;

       console.log("Initiating download via NEW backend URL:", backendDownloadUrl);

       // --- El resto es igual: crear enlace temporal y hacer clic ---
       const tempLink = document.createElement('a');
       tempLink.href = backendDownloadUrl;
       tempLink.setAttribute('download', filename); // El navegador puede usar esto, pero el backend lo fuerza también
       tempLink.style.display = 'none';
       document.body.appendChild(tempLink);
       tempLink.click();
       document.body.removeChild(tempLink);

       // Restaura el botón después de un tiempo
       setTimeout(() => {
           if (buttonElement.disabled) {
              buttonElement.innerHTML = originalButtonContent;
              buttonElement.disabled = false;
              console.log('Download button re-enabled for:', filename);
           }
       }, 2500);

   } catch (error) {
       console.error('Error setting up download link:', error);
       const errorDownloadText = _t('error_download_setup_failed', "Setup Failed");
       buttonElement.innerHTML = `<i class="ri-error-warning-line"></i> ${errorDownloadText}`;
       // Llama a la función showError global
       showError(_t('error_download_initiation', 'Could not prepare download. Please check console or try again.'));
       setTimeout(() => {
            if (buttonElement.disabled) {
               buttonElement.innerHTML = originalButtonContent;
               buttonElement.disabled = false;
            }
       }, 3500);
   }
}

/**
 * Maneja los clics dentro del contenedor de resultados para iniciar descargas.
 * Obtiene itag y la URL original para enviar al backend.
 * Usado como el manejador de eventos para la delegación en mediaListContainer.
 * @param {Event} event - El objeto del evento click.
 */
async function handleDownloadClick(event) {
    const target = event.target;
    let downloadType = null;
    let qualitySelectElement = null;
    let buttonElement = null;

    // Identifica si se hizo clic en un botón de descarga (video o audio)
    if (target.matches('#download-video-btn') || target.closest('#download-video-btn')) {
        downloadType = 'video';
        buttonElement = target.closest('#download-video-btn');
        qualitySelectElement = buttonElement?.closest('.youtube-quality-selector')?.querySelector('.video-select');
    } else if (target.matches('#download-audio-btn') || target.closest('#download-audio-btn')) {
        downloadType = 'audio';
        buttonElement = target.closest('#download-audio-btn');
        qualitySelectElement = buttonElement?.closest('.youtube-quality-selector')?.querySelector('.audio-select');
    }

    // Si no es un botón de descarga o falta algo, no hace nada
    if (!downloadType || !qualitySelectElement || !buttonElement) {
        return;
    }

     // >>> NECESITAMOS la URL original que introdujo el usuario <<<
     const youtubeUrlInput_dl = document.getElementById('url-input-youtube'); // Búscalo de nuevo aquí
     if (!youtubeUrlInput_dl) {
          showError("Cannot find YouTube URL input field when trying to download.");
          return;
     }
     const originalYouTubeUrl = youtubeUrlInput_dl.value.trim();
     if (!originalYouTubeUrl) {
         showError("Original YouTube URL is missing from input when trying to download.");
         return; // Necesitamos la URL original
     }


    console.log('handleDownloadClick triggered for:', downloadType, 'with Original URL:', originalYouTubeUrl);
    event.preventDefault();
    event.stopPropagation();

    // Previene doble-clic rápido mientras el botón ya está procesando
    if (buttonElement.disabled) {
        console.warn('Download button is already disabled. Ignoring click.');
        return;
    }

    // Obtiene la opción y verifica que sea válida
    const selectedOption = qualitySelectElement.options[qualitySelectElement.selectedIndex];
    const itag = selectedOption?.dataset.itag; // << Intenta obtener itag

    if (!selectedOption || !itag) { // << Verifica itag
        showError(_t('error_no_quality_selected', 'Please select a quality option with a valid format ID (itag).'));
        return;
    }

    // Obtiene datos y llama a la descarga
    const encodedFilename = selectedOption.dataset.filename;
    const filename = encodedFilename
         ? decodeURIComponent(encodedFilename)
         : (downloadType === 'video' ? 'youtube_video.mp4' : 'youtube_audio.mp3');

    // Llama a la función de descarga con URL original, itag, filename
    await triggerDownload(originalYouTubeUrl, itag, filename, buttonElement); // Usa la URL original
}


// ===========================================================
// --- FUNCIÓN DE INICIALIZACIÓN PARA LA PÁGINA YOUTUBE ---
// El router SPA (index.public.js) llama a esta función cuando
// se carga o navega a la página de YouTube.
// ===========================================================
function initYouTubePage() {

    // --- 1. Búsqueda de elementos DOM específicos de YouTube ---
    // Se hace CADA VEZ que esta función se ejecuta (compatible con SPA)
    const urlInput_init = document.getElementById('url-input-youtube');
    const getVideosButton_init = document.getElementById('GetVideosYoutube');
    const mediaListContainer_init = document.getElementById('media-list');
    const errorContainer_init = document.getElementById('error-container');
    const infoSection_init = document.getElementById('youtube-info-section');

    // --- 2. Guardia: Salir si faltan elementos esenciales ---
    if (!urlInput_init || !getVideosButton_init || !mediaListContainer_init || !errorContainer_init || !infoSection_init) {
        console.error("❌ YouTube page elements not found during initialization. Aborting setup for this page load. Check youtube.ejs partial and element IDs.");
        return; // No configurar nada si la página no está completa
    }

    // --- 3. Funciones Auxiliares Internas (Definidas dentro de initYouTubePage) ---
    //    Estas operan sobre los elementos encontrados en ESTA ejecución (_init)

    /** Limpia resultados, errores y clases del input. */
    function clearResults_internal() {
        if (mediaListContainer_init) mediaListContainer_init.innerHTML = "";
        if (errorContainer_init) {
            errorContainer_init.textContent = "";
            errorContainer_init.style.display = "none";
            errorContainer_init.className = 'error-message';
        }
        if (urlInput_init) urlInput_init.classList.remove("error-input");
        // Mostrar la info section de nuevo si no hay errores y el input está vacío?
        // if (infoSection_init && !errorContainer_init.textContent && !urlInput_init.value) {
        //    infoSection_init.classList.remove('hidden');
        //}
    }

    /** Muestra estado de carga en el botón GetVideos. */
    function showLoading_internal(text) {
        if (getVideosButton_init) {
            getVideosButton_init.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${text}`;
            getVideosButton_init.disabled = true;
        }
        if (urlInput_init) urlInput_init.disabled = true;
    }

    /** Restaura el botón GetVideos y el input. */
    function hideLoading_internal(text) {
        if (getVideosButton_init) {
            getVideosButton_init.textContent = text;
            getVideosButton_init.disabled = false;
        }
        if (urlInput_init) urlInput_init.disabled = false;
    }

    /** Genera y muestra la tarjeta de resultados. */
    function displayResults_internal(data) {
        if (infoSection_init) infoSection_init.classList.add('hidden'); // Oculta info al mostrar
        if (!mediaListContainer_init) return; // Guardia extra
        mediaListContainer_init.innerHTML = '';

        const resultItem = document.createElement('div');
        resultItem.className = 'youtube-result-card';

        // Genera opciones de VIDEO con data-itag
        let videoOptionsHtml = `<option value="" disabled>${_t('no_video_formats', 'No MP4 video formats found')}</option>`;
        if (data.videoFormats && data.videoFormats.length > 0) {
            videoOptionsHtml = data.videoFormats.map(format => {
                const qualitySuffix = format.qualityLabel ? format.qualityLabel.replace(/\s+/g, '') : 'video';
                const baseFilename = typeof data.sanitizedTitle === 'string' ? data.sanitizedTitle : 'youtube_video';
                const filename = `${baseFilename}_${qualitySuffix}.mp4`;
                const sizeInfo = format.size ? ` (${format.size})` : ''; // No será 'null' en la string
                const label = `${format.qualityLabel || 'Video'} (MP4${format.hasAudio ? '' : '/Video Only'})${sizeInfo}`;
                // Asegurarse que format.itag existe
                const itagAttr = format.itag ? `data-itag="${format.itag}"` : '';
                // 'value' ya no es necesario si no lo usamos directamente, pero no estorba
                return `<option value="${format.url}" ${itagAttr} data-filename="${encodeURIComponent(filename)}">${label}</option>`;
            }).join('');
        }

        // Genera opciones de AUDIO con data-itag
        let audioOptionsHtml = `<option value="" disabled>${_t('no_audio_formats', 'No audio formats found')}</option>`;
        if (data.audioFormats && data.audioFormats.length > 0) {
             audioOptionsHtml = data.audioFormats.map(format => {
                 const bitrateSuffix = format.bitrateLabel ? format.bitrateLabel.replace(/\s+/g, '') : 'audio';
                 const baseFilename = typeof data.sanitizedTitle === 'string' ? data.sanitizedTitle : 'youtube_audio';
                 const filename = `${baseFilename}_${bitrateSuffix}.mp3`;
                 const containerLabel = format.container === 'm4a' ? 'M4A (AAC)' : ((format.container || 'audio').toUpperCase());
                 const sizeInfo = format.size ? ` (${format.size})` : ''; // No será 'null' en la string
                 const label = `${format.bitrateLabel || 'Audio'} (${containerLabel})${sizeInfo}`;
                  // Asegurarse que format.itag existe
                  const itagAttr = format.itag ? `data-itag="${format.itag}"` : '';
                 // 'value' ya no es necesario
                 return `<option value="${format.url}" ${itagAttr} data-filename="${encodeURIComponent(filename)}">${label}</option>`;
            }).join('');
        }

        // Construye el HTML de la tarjeta
        const timestamp = Date.now();
        resultItem.innerHTML = `
            <img src="${data.thumbnail}" alt="${_t('VideoThumbnailAlt', 'Video thumbnail for')} ${data.title || 'video'}" class="youtube-thumbnail" loading="lazy">
            <h3 class="youtube-title">${data.title || 'Untitled Video'}</h3>
            <div class="youtube-quality-selector">
                 <label for="video-quality-select-${timestamp}">${_t('select_video_quality', 'Video Quality:')}</label>
                 <select id="video-quality-select-${timestamp}" class="quality-select video-select" ${!data.videoFormats || data.videoFormats.length === 0 ? 'disabled' : ''}>${videoOptionsHtml}</select>
                 <button id="download-video-btn" class="download-button video-download" ${!data.videoFormats || data.videoFormats.length === 0 ? 'disabled' : ''}><i class="ri-video-download-line"></i> ${_t('DownloadVideo', 'Download Video')}</button>
            </div>
            <div class="youtube-quality-selector">
                 <label for="audio-quality-select-${timestamp}">${_t('select_audio_quality', 'Audio Quality:')}</label>
                 <select id="audio-quality-select-${timestamp}" class="quality-select audio-select" ${!data.audioFormats || data.audioFormats.length === 0 ? 'disabled' : ''}>${audioOptionsHtml}</select>
                  <button id="download-audio-btn" class="download-button audio-download" ${!data.audioFormats || data.audioFormats.length === 0 ? 'disabled' : ''}><i class="ri-music-2-line"></i> ${_t('DownloadAudio', 'Download Audio')}</button>
            </div>`;
        mediaListContainer_init.appendChild(resultItem);
    }

    // --- 4. Adjuntar Event Listeners ---
    // Listener para el botón "Get Videos" - Limpiar listener anterior clonando
    const old_getVideosButton = getVideosButton_init;
    if (!old_getVideosButton.parentNode) {
        console.warn("GetVideosButton parentNode not found, cannot attach listener via cloning.");
    } else {
        const new_getVideosButton = old_getVideosButton.cloneNode(true);
        old_getVideosButton.parentNode.replaceChild(new_getVideosButton, old_getVideosButton);

        new_getVideosButton.addEventListener('click', async () => { // Listener en el NUEVO botón
            const youtubeUrl = urlInput_init.value.trim();
            clearResults_internal(); // Llama a la interna

            if (!youtubeUrl) { showError(_t('error_youtube_url_empty', "Please enter a YouTube URL.")); return; }
            // Validar URL de youtube con ytdl (si es posible/deseado - require import)
            // import ytdl from '@distube/ytdl-core'; <-- Necesitaría browserify o similar si se importa directamente
            if (!youtubeUrl.includes('youtube.com/watch?v=') && !youtubeUrl.includes('youtu.be/')) { showError(_t('error_youtube_url_invalid', "Please enter a valid YouTube video URL.")); return; }

            if (infoSection_init) infoSection_init.classList.add('hidden');
            const fetchingText = _t('Fetching', "Fetching...");
            const originalButtonText = new_getVideosButton.textContent; // Usa el botón actual (clonado)
            showLoading_internal(fetchingText); // Llama a la interna

            try {
                const response = await fetch('/api/youtube/details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify({ url: youtubeUrl }),
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    // Si el backend da mensaje de error, usarlo. Si no, crear uno genérico.
                    const backendMessage = result?.message;
                    throw new Error(backendMessage || _t('error_server_generic_youtube', `Failed to fetch video details (Status: ${response.status})`));
                }
                displayResults_internal(result.data); // Llama a la interna
            } catch (error) {
                console.error('Fetch/Processing Error (YouTube):', error);
                showError(`${_t('Error', 'Error')}: ${error.message}`); // Llama a la global
            } finally {
                hideLoading_internal(originalButtonText || _t('GetVideosYoutube', "Get videos")); // Llama a la interna
            }
        });
    }


    // Listener para botones de descarga (Delegación en el contenedor)
    // Usa el contenedor encontrado (_init) y el manejador global (handleDownloadClick)
    if (mediaListContainer_init) {
        // Siempre remueve primero por seguridad en SPA
        mediaListContainer_init.removeEventListener('click', handleDownloadClick);
        // Añade el listener que llama a la función global nombrada
        mediaListContainer_init.addEventListener('click', handleDownloadClick);
    } else {
       // El guardia inicial ya debería haber prevenido llegar aquí si mediaListContainer_init era null
       console.error("mediaListContainer not available to attach download listener (should have aborted earlier).");
    }

} // === Fin de initYouTubePage ===


// ===========================================================
// --- REGISTRO PARA EL ROUTER SPA (DEBE ESTAR AL FINAL) ---
// Registra la función initYouTubePage para que index.public.js la llame.
// ===========================================================
window.pageInitializers = window.pageInitializers || {};
window.pageInitializers.youtube = initYouTubePage;