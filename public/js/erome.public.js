// public/js/erome.public.js
function initEromePage() {
    // --- Referencias Elementos DOM (Necesarios para Fetch/Download) ---
    const urlInput = document.getElementById("url-input");
    const getVideosButton = document.getElementById("GetVideos");
    const errorContainer = document.getElementById("error-container");
    const mediaList = document.getElementById("media-list");

    // --- Listener 'Get visuals' (Fetch) ---
    getVideosButton.addEventListener("click", async () => {
        const url = urlInput.value.trim();
        errorContainer.textContent = "";
        mediaList.innerHTML = "";
        errorContainer.style.display = "none";
        urlInput.classList.remove("error-input");

        if (!url) {
            try { errorContainer.textContent = i18next.t('error_url_empty'); }
            catch (e) { errorContainer.textContent = "Please enter an Erome URL."; }
            errorContainer.style.display = "block";
            urlInput.classList.add("error-input");
            return;
        }

        // --- Estado Carga ---
        let fetchingText = "Fetching...";
        let getVisualsText = "Get visuals";
        let downloadVideoText = "Download Video";
        let downloadImageText = "Download Image";
        let errorNoMediaText = "No media found or the album might be private/invalid.";
        let errorText = "Error";
        try {
            // Intenta obtener traducciones si i18next está disponible
            fetchingText = i18next.t('Fetching', { defaultValue: "Fetching..." });
            getVisualsText = i18next.t('GetVideos', { defaultValue: "Get visuals" });
            downloadVideoText = i18next.t('DownloadVideo', { defaultValue: "Download Video" });
            downloadImageText = i18next.t('DownloadImage', { defaultValue: "Download Image" });
            errorNoMediaText = i18next.t('error_no_media', { defaultValue: "No media found or the album might be private/invalid." });
            errorText = i18next.t('Error', { defaultValue: "Error" });
        } catch(e) { console.warn("i18next not fully configured or error getting translations.") }

        getVideosButton.textContent = fetchingText;
        getVideosButton.disabled = true;
        urlInput.disabled = true;

        try {
            const response = await fetch("/erome/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server Error: ${response.status}`);
            }

            if (data && Array.isArray(data) && data.length > 0) {
                data.forEach((item) => {
                    const element = document.createElement("div");
                    element.classList.add("media-item");

                    if (item.type === "video" && item.url) {
                        element.classList.add("video-item");
                        const filename = item.filename || 'erome_video.mp4';
                        // El video y el icono play son manejados por UI.js para abrir modal
                        element.innerHTML = `
                           <video preload="metadata" poster="${item.thumbnail || ''}">
                               <source src="${item.url}" type="video/mp4">
                               Your browser does not support the video tag.
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
                         // La imagen es manejada por UI.js para abrir modal
                        element.innerHTML = `
                          <img src="${thumb}" alt="Erome Image Thumbnail" loading="lazy" data-full-url="${fullUrl}">
                          <button class="Download" data-url="${encodeURIComponent(fullUrl)}" data-filename="${encodeURIComponent(filename)}">
                              ${downloadImageText} <i class="ri-download-2-line"></i>
                           </button>`;
                    } else {
                        console.warn("Media item ignored, missing type or url:", item);
                        return;
                    }

                    // Solo añadir si se generó contenido
                    if (element.innerHTML) mediaList.appendChild(element);
                });
            } else {
                errorContainer.textContent = errorNoMediaText;
                errorContainer.style.display = "block";
            }
        } catch (error) {
            console.error("Fetch/Processing Error:", error);
            errorContainer.textContent = `${errorText}: ${error.message}`;
            errorContainer.style.display = "block";
            urlInput.classList.add('error-input');
        } finally {
            // --- Reset Carga ---
            getVideosButton.textContent = getVisualsText;
            getVideosButton.disabled = false;
            urlInput.disabled = false;
        }
    });

    // --- Listener para Botones de Descarga (Delegación) ---
    mediaList.addEventListener('click', async (event) => {
        // IMPORTANTE: Solo actuar si el click fue en un botón de descarga
        const downloadButton = event.target.closest('.Download');
        if (!downloadButton) return;

        event.preventDefault();

        const urlToDownload = decodeURIComponent(downloadButton.dataset.url);
        const filename = decodeURIComponent(downloadButton.dataset.filename);

        downloadButton.disabled = true;
        const originalText = downloadButton.innerHTML;
        let downloadingText = "Preparing...";
         try{ downloadingText = i18next.t('PreparingDownload', { defaultValue: "Preparing..."}); } catch(e){}
         downloadButton.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${downloadingText}`;

        try {
            // 1. Construye la URL del backend para la descarga
            const backendDownloadUrl = `/erome/download?url=${encodeURIComponent(urlToDownload)}&filename=${encodeURIComponent(filename)}`;

            // 2. Crea un enlace temporal para iniciar la descarga
            const tempLink = document.createElement('a');
            tempLink.href = backendDownloadUrl;
            tempLink.setAttribute('download', filename);
            tempLink.style.display = 'none';
            document.body.appendChild(tempLink);

            // 3. Simula un click en el enlace
            tempLink.click();

            // 4. Limpia el enlace temporal
            document.body.removeChild(tempLink);

            // 5. Resetea el botón después de un tiempo prudencial
            setTimeout(() => {
                downloadButton.innerHTML = originalText;
                downloadButton.disabled = false;
            }, 1500);

        } catch (error) {
            console.error('Error initiating download link:', error);
            let errorDownloadText = "Error";
            try { errorDownloadText = i18next.t('error_download_setup_failed', { defaultValue: "Error" });} catch(e){}
             downloadButton.innerHTML = `<i class="ri-error-warning-line"></i> ${errorDownloadText}`;
             // Resetear el botón tras mostrar el error
             setTimeout(() => {
                downloadButton.innerHTML = originalText;
                downloadButton.disabled = false;
             }, 3000);
        }
    });
};

// --- Fallback para Carga Directa ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEromePage);
} else {
    // --- Disponibilidad Global ---
    window.pageInitializers = window.pageInitializers || {};
    window.pageInitializers.erome = initEromePage;
}