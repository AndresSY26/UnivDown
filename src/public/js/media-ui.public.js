function initUIPage() {
  // --- Referencias Elementos DOM (Necesarios para UI) ---
  const mediaList = document.getElementById("media-list");
  const errorContainer = document.getElementById("error-container");

  // --- Referencias Modal Imagen ---
  const imageModal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const closeModalButton = document.getElementById("closeModal");

  // --- Referencias Modal Video ---
  const videoModal = document.getElementById("videoModal");
  const modalVideo = document.getElementById("modalVideo");
  const closeVideoModalButton = document.getElementById("closeVideoModal");
  const playerContainer = document.getElementById("videoPlayerContainer");

  // --- Referencias Controles Video Personalizados ---
  const customControls = document.getElementById("customControls");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const playPauseIcon = playPauseBtn.querySelector("i");
  const progressBar = document.getElementById("progressBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  // Volumen
  const volumeContainer = document.getElementById("volumeContainer");
  const volumeBtn = document.getElementById("volumeBtn");
  const volumeIcon = volumeBtn.querySelector("i");
  const volumeBar = document.getElementById("volumeBar");
  const volumeSliderPopup = document.getElementById("volumeSliderContainer");
  // Fullscreen
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const fullscreenIcon = fullscreenBtn.querySelector("i");

  // --- Estado y Timers (UI) ---
  let controlsTimeout;
  let volumePopupTimeout;
  let isSeeking = false;
  let isHoveringVolume = false;
  let wasVolumeSeeking = false;

  // --- Funciones Auxiliares (UI) ---
  function formatTime(timeInSeconds) {
    if (
      isNaN(timeInSeconds) ||
      timeInSeconds === Infinity ||
      timeInSeconds < 0
    ) {
      return "0:00";
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function updatePlayPauseIcon() {
    const isPaused = modalVideo.paused || modalVideo.ended;
    playPauseIcon.classList.toggle("ri-play-fill", isPaused);
    playPauseIcon.classList.toggle("ri-pause-line", !isPaused);
    if (isPaused) {
      modalVideo.setAttribute("data-paused", "true");
    } else {
      modalVideo.removeAttribute("data-paused");
    }
  }

  function updateVolumeIcon() {
    volumeIcon.classList.remove(
      "ri-volume-up-line",
      "ri-volume-down-line",
      "ri-volume-mute-line"
    );
    if (modalVideo.muted || modalVideo.volume === 0) {
      volumeIcon.classList.add("ri-volume-mute-line");
    } else if (modalVideo.volume < 0.5) {
      volumeIcon.classList.add("ri-volume-down-line");
    } else {
      volumeIcon.classList.add("ri-volume-up-line");
    }
  }

  function updateVolumeBarAppearance() {
    const percentage = modalVideo.muted ? 0 : modalVideo.volume * 100;
    volumeBar.style.setProperty("--volume-percentage", `${percentage}%`);
    if (!isSeeking && !wasVolumeSeeking) {
      volumeBar.value = modalVideo.muted ? 0 : modalVideo.volume;
    } else if (wasVolumeSeeking) {
      setTimeout(() => {
        wasVolumeSeeking = false;
      }, 50);
    }
    updateVolumeIcon();
  }

  function updateFullscreenIcon() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    fullscreenIcon.classList.toggle("ri-fullscreen-exit-line", !!isFullscreen);
    fullscreenIcon.classList.toggle("ri-fullscreen-line", !isFullscreen);
  }

  function updateProgressBarAppearance() {
    if (!isNaN(modalVideo.duration)) {
      const percentage = (modalVideo.currentTime / modalVideo.duration) * 100;
      progressBar.style.setProperty("--progress-percentage", `${percentage}%`);
    } else {
      progressBar.style.setProperty("--progress-percentage", `0%`);
    }
  }

  function updateProgress() {
    if (!isNaN(modalVideo.duration)) {
      if (!isSeeking) {
        progressBar.value = modalVideo.currentTime;
      }
      updateProgressBarAppearance();
      currentTimeEl.textContent = formatTime(modalVideo.currentTime);
    } else {
      currentTimeEl.textContent = "0:00";
      progressBar.value = 0;
      updateProgressBarAppearance();
    }
  }

  function togglePlayPause() {
    if (modalVideo.paused || modalVideo.ended) {
      modalVideo.play().catch((e) => console.error("Error playing video:", e));
    } else {
      modalVideo.pause();
    }
    showControls(true);
  }

  // --- Visibilidad de Controles (UI) ---
  function showControls(forceResetTimer = false) {
    clearTimeout(controlsTimeout);
    playerContainer.classList.remove("hide-cursor");
    customControls.classList.add("visible");

    const isPopupVisible =
      volumeSliderPopup.classList.contains("popup-visible");
    if (!modalVideo.paused && !modalVideo.ended && (!isSeeking || forceResetTimer) && !isHoveringVolume) {
      hideControlsAfterDelay();
    } else if (isHoveringVolume) {
      clearTimeout(controlsTimeout);
    }
  }

  function hideControlsAfterDelay() {
    clearTimeout(controlsTimeout);
    const isPopupVisible =
      volumeSliderPopup.classList.contains("popup-visible");
    if (modalVideo.paused || modalVideo.ended || isSeeking || isHoveringVolume) {
      customControls.classList.add("visible");
      playerContainer.classList.remove("hide-cursor");
      return;
    }
    controlsTimeout = setTimeout(() => {
      if (modalVideo.paused || modalVideo.ended || isSeeking || isHoveringVolume)
        return;
      customControls.classList.remove("visible");
      playerContainer.classList.add("hide-cursor");
    }, 1900);
  }

  // --- Event Listeners Video (`modalVideo`) (UI) ---
  modalVideo.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(modalVideo.duration);
    progressBar.max = modalVideo.duration || 0;
    updateProgress();
    updateVolumeBarAppearance();
  });

  modalVideo.addEventListener("timeupdate", updateProgress);
  modalVideo.addEventListener("volumechange", updateVolumeBarAppearance);
  modalVideo.addEventListener("play", () => {
    updatePlayPauseIcon();
    hideControlsAfterDelay();
  });
  modalVideo.addEventListener("pause", () => {
    updatePlayPauseIcon();
    showControls();
    clearTimeout(controlsTimeout);
  });
  modalVideo.addEventListener("ended", () => {
    updatePlayPauseIcon();
    showControls();
    clearTimeout(controlsTimeout);
  });
  modalVideo.addEventListener("click", (e) => {
    if (e.target === modalVideo) {
      togglePlayPause();
    }
  });

  // --- Event Listeners Controles Personalizados (UI) ---
  playPauseBtn.addEventListener("click", togglePlayPause);
  // Barra de Progreso
  progressBar.addEventListener("input", () => {
    isSeeking = true;
    currentTimeEl.textContent = formatTime(progressBar.value);
    updateProgressBarAppearance();
    clearTimeout(controlsTimeout);
  });
  progressBar.addEventListener("change", () => {
    modalVideo.currentTime = progressBar.value;
    setTimeout(() => {
      isSeeking = false;
      showControls(true);
    }, 50);
  });
  progressBar.addEventListener("mousedown", () => {
    isSeeking = true;
    clearTimeout(controlsTimeout);
  });
  progressBar.addEventListener(
    "touchstart",
    () => {
      isSeeking = true;
      clearTimeout(controlsTimeout);
    },
    { passive: true }
  );

  function handleSeekEnd() {
    setTimeout(() => {
      if (isSeeking) {
        isSeeking = false;
        showControls(true);
      }
    }, 100);
  }
  progressBar.addEventListener("mouseup", handleSeekEnd);
  progressBar.addEventListener("touchend", handleSeekEnd);
  progressBar.addEventListener("mouseenter", () =>
    clearTimeout(controlsTimeout)
  );
  progressBar.addEventListener("mouseleave", () => {
    if (!isSeeking) showControls(true);
  });

  // --- Event Listeners Volumen (UI - CON TIMER PARA POPUP) ---
  volumeContainer.addEventListener("mouseenter", () => {
    clearTimeout(volumePopupTimeout);
    isHoveringVolume = true;
    volumeSliderPopup.classList.add("popup-visible");
    clearTimeout(controlsTimeout);
    customControls.classList.add("visible");
    playerContainer.classList.remove("hide-cursor");
  });
  volumeContainer.addEventListener("mouseleave", () => {
    clearTimeout(volumePopupTimeout);
    volumePopupTimeout = setTimeout(() => {
      if (!volumeContainer.matches(":hover") && !volumeSliderPopup.matches(":hover") && !wasVolumeSeeking) {
        volumeSliderPopup.classList.remove("popup-visible");
        isHoveringVolume = false;
        showControls(true);
      }
    }, 1000);
  });
  volumeSliderPopup.addEventListener("mouseenter", () => {
    clearTimeout(volumePopupTimeout);
    isHoveringVolume = true;
    clearTimeout(controlsTimeout);
    customControls.classList.add("visible");
    playerContainer.classList.remove("hide-cursor");
  });
  volumeSliderPopup.addEventListener("mouseleave", () => {
    clearTimeout(volumePopupTimeout);
    volumePopupTimeout = setTimeout(() => {
      if (!volumeContainer.matches(":hover") && !volumeSliderPopup.matches(":hover") && !wasVolumeSeeking) {
        volumeSliderPopup.classList.remove("popup-visible");
        isHoveringVolume = false;
        showControls(true);
      }
    }, 1000);
  });
  volumeBtn.addEventListener("click", () => {
    modalVideo.muted = !modalVideo.muted;
    if (!modalVideo.muted && modalVideo.volume === 0) {
      modalVideo.volume = 0.7;
      volumeBar.value = 0.7;
    }
    if (modalVideo.muted) {
      volumeBar.value = 0;
    } else {
      volumeBar.value = modalVideo.volume;
    }
    updateVolumeBarAppearance();
    showControls(true);
  });
  volumeBar.addEventListener("input", () => {
    isSeeking = true;
    wasVolumeSeeking = true;
    modalVideo.muted = false;
    modalVideo.volume = volumeBar.value;
    clearTimeout(controlsTimeout);
    clearTimeout(volumePopupTimeout);
    updateVolumeIcon();
  });
  function handleVolumeSeekStart() {
    isSeeking = true;
    wasVolumeSeeking = true;
    clearTimeout(controlsTimeout);
    clearTimeout(volumePopupTimeout);
  }
  volumeBar.addEventListener("mousedown", handleVolumeSeekStart);
  volumeBar.addEventListener("touchstart", handleVolumeSeekStart, {
    passive: true,
  });
  function handleVolumeSeekEnd() {
    setTimeout(() => {
      isSeeking = false;
      if (
        volumeContainer.matches(":hover") ||
        volumeSliderPopup.matches(":hover")
      ) {
        isHoveringVolume = true;
        clearTimeout(volumePopupTimeout);
      } else {
        clearTimeout(volumePopupTimeout);
        volumePopupTimeout = setTimeout(() => {
          volumeSliderPopup.classList.remove("popup-visible");
          isHoveringVolume = false;
          showControls(true);
        }, 1000);
      }
      showControls(true);
      // wasVolumeSeeking se reseteará en el próximo updateVolumeBarAppearance o tras un pequeño delay
      setTimeout(() => {
        wasVolumeSeeking = false;
      }, 100);
    }, 50);
  }
  volumeBar.addEventListener("mouseup", handleVolumeSeekEnd);
  volumeBar.addEventListener("touchend", handleVolumeSeekEnd);

  // --- Botón Fullscreen (UI) ---
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
      const requestMethod = playerContainer.requestFullscreen || playerContainer.webkitRequestFullscreen || playerContainer.mozRequestFullScreen || playerContainer.msRequestFullscreen;
      if (requestMethod) requestMethod.call(playerContainer);
    } else {
      const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exitMethod) exitMethod.call(document);
    }
    showControls(true);
  });
  [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "msfullscreenchange",
  ].forEach((event) => {
    document.addEventListener(event, () => {
      updateFullscreenIcon();
      setTimeout(() => showControls(true), 50);
    });
  });

  // --- Control de Visibilidad General (Hover sobre Player) (UI) ---
  playerContainer.addEventListener("mouseenter", () => {
    if (!playerContainer.classList.contains("hide-cursor")) {
      showControls();
    }
  });
  playerContainer.addEventListener("mousemove", () => {
    if (playerContainer.classList.contains("hide-cursor")) {
      playerContainer.classList.remove("hide-cursor");
      customControls.classList.add("visible");
    }
    showControls(true);
  });
  playerContainer.addEventListener("mouseleave", () => {
    const isOverVolumeArea =
      volumeContainer.matches(":hover") || volumeSliderPopup.matches(":hover");
    if (!isSeeking && !isOverVolumeArea) {
      hideControlsAfterDelay();
    }
  });

  // --- Foco para Accesibilidad (UI) ---
  customControls.addEventListener("focusin", (e) => {
    clearTimeout(controlsTimeout);
    clearTimeout(volumePopupTimeout);
    customControls.classList.add("visible");
    playerContainer.classList.remove("hide-cursor");
    isHoveringVolume = volumeContainer.contains(e.target) || volumeSliderPopup.contains(e.target);
    if (volumeSliderPopup.contains(e.target)) {
      volumeSliderPopup.classList.add("popup-visible");
    }
  });
  customControls.addEventListener("focusout", (e) => {
    setTimeout(() => {
      const focusMovedTo = e.relatedTarget;
      const focusStillInsideControls = customControls.contains(focusMovedTo);
      const focusMovedToVolumeArea =
        volumeContainer.contains(focusMovedTo) ||
        volumeSliderPopup.contains(focusMovedTo);

      isHoveringVolume = focusMovedToVolumeArea;

      if (!focusStillInsideControls) {
        volumeSliderPopup.classList.remove("popup-visible");
        showControls(true);
      } else {
        if (!focusMovedToVolumeArea && !volumeSliderPopup.matches(":hover")) {
          clearTimeout(volumePopupTimeout);
          volumePopupTimeout = setTimeout(() => {
            if (!volumeContainer.matches(":hover") && !volumeSliderPopup.matches(":hover") && !wasVolumeSeeking) {
              volumeSliderPopup.classList.remove("popup-visible");
            }
          }, 1000);
        } else if (focusMovedToVolumeArea) {
          clearTimeout(volumePopupTimeout);
          volumeSliderPopup.classList.add("popup-visible");
        }
        if (!focusMovedToVolumeArea) showControls(true);
      }
    }, 0);
  });

  // --- Funciones de Modal (Apertura/Cierre) (UI) ---
  function openImageModal(src) {
    modalImage.src = src;
    imageModal.classList.add("modal-visible");
    document.body.classList.add("modal-open");
  }

  function closeImageModal() {
    imageModal.classList.remove("modal-visible");
    document.body.classList.remove("modal-open");
    modalImage.src = "";
  }

  function openVideoModal(src) {
    // Reset UI states before opening
    progressBar.value = 0;
    progressBar.style.setProperty("--progress-percentage", "0%");
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    modalVideo.volume = parseFloat(volumeBar.value);
    modalVideo.muted = modalVideo.volume === 0;
    updateVolumeBarAppearance();
    updateFullscreenIcon();
    updatePlayPauseIcon();
    clearTimeout(controlsTimeout);
    clearTimeout(volumePopupTimeout);
    volumeSliderPopup.classList.remove("popup-visible");
    customControls.classList.remove("visible");
    playerContainer.classList.remove("hide-cursor");
    isHoveringVolume = false;
    isSeeking = false;
    wasVolumeSeeking = false;

    modalVideo.src = src;
    videoModal.classList.add("modal-visible");
    document.body.classList.add("modal-open");

    const playPromise = modalVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          showControls(true);
        })
        .catch((error) => {
          console.warn("Autoplay prevented:", error);
          updatePlayPauseIcon();
          showControls();
          clearTimeout(controlsTimeout);
        });
    } else {
      // Si play() no devuelve promesa (navegadores viejos)
      showControls();
      clearTimeout(controlsTimeout);
      updatePlayPauseIcon();
    }
  }

  function closeVideoModal() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exitMethod = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitMethod)
        exitMethod
          .call(document)
          .catch((err) => console.error("Error exiting fullscreen:", err));
    }

    videoModal.classList.remove("modal-visible");
    document.body.classList.remove("modal-open");
    modalVideo.pause();

    // Guardar estado de volumen/mute para la próxima apertura (indirectamente via volumeBar.value ya está hecho)
    // const currentVolume = modalVideo.volume;
    // const isMuted = modalVideo.muted;

    modalVideo.removeAttribute("src");
    modalVideo.load();

    // Restaurar el valor de la barra de volumen (no el video directamente)
    // Esto se hará en openVideoModal leyendo volumeBar.value
    // setTimeout(() => {
    //    volumeBar.value = isMuted ? 0 : currentVolume;
    //    updateVolumeBarAppearance(); // Actualiza CSS var e icono
    // }, 0);

    // Limpiar UI state
    clearTimeout(controlsTimeout);
    clearTimeout(volumePopupTimeout);
    customControls.classList.remove("visible");
    playerContainer.classList.remove("hide-cursor");
    volumeSliderPopup.classList.remove("popup-visible");
    isSeeking = false;
    isHoveringVolume = false;
    wasVolumeSeeking = false;
    progressBar.value = 0;
    updateProgressBarAppearance();
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
  }

  // --- Listeners Cerrar Modales (UI) ---
  closeModalButton.addEventListener("click", closeImageModal);
  closeVideoModalButton.addEventListener("click", closeVideoModal);
  imageModal.addEventListener("click", (event) => {
    if (event.target === imageModal) {
      closeImageModal();
    }
  });
  videoModal.addEventListener("click", (event) => {
    if (event.target === videoModal) {
      closeVideoModal();
    }
  });
  // Cerrar con tecla Escape y Atajos Video (UI)
  document.addEventListener("keydown", (event) => {
    // Cerrar modales con ESC
    if (event.key === "Escape") {
      if (imageModal.classList.contains("modal-visible")) {
        closeImageModal();
      } else if (videoModal.classList.contains("modal-visible")) {
        closeVideoModal();
      }
      return; // Evitar que procese atajos de video si cerró modal
    }

    // --- Atajos de teclado para video ---
    if (videoModal.classList.contains("modal-visible")) {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.isContentEditable))
        return;

      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          event.preventDefault();
          modalVideo.currentTime = Math.max(0, modalVideo.currentTime - 5);
          showControls(true);
          break;
        case "ArrowRight":
          event.preventDefault();
          if (!isNaN(modalVideo.duration)) {
            modalVideo.currentTime = Math.min(
              modalVideo.duration,
              modalVideo.currentTime + 5
            );
            showControls(true);
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          let newVolumeUp = Math.min(1, modalVideo.volume + 0.05);
          modalVideo.volume = newVolumeUp;
          modalVideo.muted = false;
          volumeBar.value = newVolumeUp;
          updateVolumeBarAppearance();
          showControls(true);
          // Mostrar popup volumen brevemente
          clearTimeout(volumePopupTimeout);
          volumeSliderPopup.classList.add("popup-visible");
          volumePopupTimeout = setTimeout(() => {
            if (!volumeContainer.matches(":hover") && !volumeSliderPopup.matches(":hover")) {
              volumeSliderPopup.classList.remove("popup-visible");
              isHoveringVolume = false;
            }
          }, 1500);
          break;
        case "ArrowDown":
          event.preventDefault();
          let newVolumeDown = Math.max(0, modalVideo.volume - 0.05);
          modalVideo.volume = newVolumeDown;
          modalVideo.muted = newVolumeDown === 0;
          volumeBar.value = newVolumeDown;
          updateVolumeBarAppearance();
          showControls(true);
          // Mostrar popup volumen brevemente
          clearTimeout(volumePopupTimeout);
          volumeSliderPopup.classList.add("popup-visible");
          volumePopupTimeout = setTimeout(() => {
            if (
              !volumeContainer.matches(":hover") &&
              !volumeSliderPopup.matches(":hover")
            ) {
              volumeSliderPopup.classList.remove("popup-visible");
              isHoveringVolume = false;
            }
          }, 1500);
          break;
        case "m":
          event.preventDefault();
          volumeBtn.click();
          break;
        case "f":
          event.preventDefault();
          fullscreenBtn.click();
          break;
      }
    }
  });

  // --- Listener Abrir Modales (Delegación desde #media-list) (UI) ---
  mediaList.addEventListener("click", (event) => {
    const target = event.target;
    // IMPORTANTE: Ignorar si el click fue en un botón de descarga
    if (target.closest(".Download")) return;

    const mediaItem = target.closest(".media-item");
    if (!mediaItem) return;

    // Abrir Modal Imagen
    if (
      target.tagName === "IMG" &&
      mediaItem.classList.contains("image-item")
    ) {
      const fullImageUrl = target.dataset.fullUrl || target.src;
      openImageModal(fullImageUrl);
    }
    // Abrir Modal Video (click en video o icono play)
    else if ((target.tagName === "VIDEO" || target.classList.contains("video-play-icon")) && mediaItem.classList.contains("video-item")) {
      const videoElement = mediaItem.querySelector("video");
      const sourceElement = videoElement?.querySelector("source");
      const videoUrl = sourceElement?.src || videoElement?.src;

      if (videoUrl) {
        openVideoModal(videoUrl);
      } else {
        console.error("Video source URL not found for this item.");
        let errorVideoUrlText = "Could not find video URL.";
        try {
          errorVideoUrlText = i18next.t("error_video_url_not_found", {
            defaultValue: "Could not find video URL.",
          });
        } catch (e) {}
        errorContainer.textContent = errorVideoUrlText;
        errorContainer.style.display = "block";
        setTimeout(() => {
          errorContainer.style.display = "none";
        }, 3000);
      }
    }
  });
};

// --- Fallback para Carga Directa ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUIPage);
} else {
  // --- Disponibilidad Global ---
  window.initializeMediaUI = window.initializeMediaUI || {};
  window.initializeMediaUI = initUIPage;
}