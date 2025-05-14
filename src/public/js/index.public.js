// public/js/index.public.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos DOM ---
  const contentElement = document.getElementById("content");
  const header = document.getElementById("header");
  // Asegúrate de que estos selectores coincidan con tu HTML del header INCLUIDO
  const navigationLinks = document.querySelectorAll("#navigation-menu .social-links a, .logo-container a");
  const titleElement = document.querySelector("title");
  const scrollToTopButton = document.getElementById("scrollToTopBtn");

  // --- Selectores para otras funcionalidades (dentro del header) ---
  const themeToggle = document.getElementById("theme-toggle");
  const themeDropdown = document.getElementById("theme-dropdown");
  const languageButton = document.getElementById("language-button");
  const languageDropdown = document.getElementById("language-dropdown");
  const menuToggle = document.getElementById("menu-toggle");
  const closeMenu = document.getElementById("close-menu");
  const navigationMenu = document.getElementById("navigation-menu");

  // --- Íconos ---
  const sunIcon = '<i class="ri-sun-line"></i>';
  const moonIcon = '<i class="ri-moon-line"></i>';

  // --- Media Query ---
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // --- Banner Cookies ---
  const banner = document.getElementById('cookieConsentBanner');
  const acceptButton = document.getElementById('acceptCookieConsent');

  // --- Estado SPA ---
  let currentPage = window.location.pathname;
  let isLoading = false;

  // --- FUNCIONES CORE SPA ---

  async function loadPageContent(href, isPopState = false) {
    if (isLoading || (!isPopState && href === currentPage)) {
      if (navigationMenu && navigationMenu.classList.contains("open")) {
        toggleMenu();
      }
      console.log("[SPA] Carga detenida: ya cargando o misma página.");
      return;
    }
    isLoading = true;

    if (navigationMenu && navigationMenu.classList.contains("open")) {
      toggleMenu();
    }

    if (contentElement) {
      contentElement.classList.add("fade-out");
      contentElement.style.opacity = "0";
      contentElement.style.transition = "none";
    }

    try {
      // 1. Obtener el HTML parcial
      const response = await fetch(`${href}?partial=true`);
      if (!response.ok) {
        throw new Error(`Error de red: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();

      // 2. Inyectar el HTML (aún oculto)
      if (contentElement) {
        contentElement.innerHTML = html;
      } else {
        console.error("[SPA] Error crítico: Elemento #content no encontrado.");
        isLoading = false;
        return;
      }

      // 3. Esperar a que los NUEVOS stylesheets (si los hubiera en el parcial) carguen
      const newStylesheets = contentElement.querySelectorAll('link[rel="stylesheet"]');
      if (newStylesheets.length > 0) {
        const loadPromises = Array.from(newStylesheets).map((link) => {
          return new Promise((resolve) => {
            link.addEventListener("load", resolve, { once: true });
            link.addEventListener(
              "error",
              () => {
                console.error(`[SPA] Error cargando stylesheet: ${link.href}`);
                resolve();
              },
              { once: true }
            );
            setTimeout(() => resolve(), 2000); // Timeout fallback
          });
        });
        await Promise.all(loadPromises);
      }

      // 4. Hacer visible el contenido con transición
      if (contentElement) {
        contentElement.style.transition = "";
        contentElement.classList.remove("fade-out");
        contentElement.style.opacity = "1";
      }

      // --- PASOS POST-VISUALIZACIÓN ---
      // 5. Actualizar historial y estado (si no es popstate)
      if (!isPopState) {
        history.pushState({ path: href }, "", href);
      }
      currentPage = href;

      // 6. Ejecutar scripts específicos de la página
      executePageScripts();

      // 7. Actualizar título y link activo
      updatePageTitle();
      updateActiveLink();

      // 8. Reiniciar animaciones on-scroll para el nuevo contenido
      initializeAnimationsForContent(contentElement);

      // 9. Scroll al inicio
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("[SPA] Error durante loadPageContent:", error);
      if (contentElement) {
        contentElement.innerHTML = `<div class="container error-message">Error loading content. Try <a href="${href}">reloading</a> or go back <a href="/">home</a>. (${error.message})</div>`;
        contentElement.classList.remove("fade-out");
        contentElement.style.opacity = "1";
        contentElement.style.transition = "";
      }
    } finally {
      isLoading = false;
    }
  }

  // --- executePageScripts ---
  function executePageScripts() {
    if (typeof window.pageInitializers !== "object" || window.pageInitializers === null) {
      console.warn("[SPA] Objeto window.pageInitializers no encontrado.");
      if (typeof window.initializeMediaUI === "function") {
        try { window.initializeMediaUI(); } catch (e) { console.error("[SPA] Error inicializando Media UI:", e); }
      }
      return;
    }

    if (typeof window.initializeMediaUI === "function") {
      try { window.initializeMediaUI(); } catch (e) { console.error("[SPA] Error llamando initializeMediaUI:", e); }
    }

    let initializerToCall = null;
    let pageKey = "";

    switch (currentPage) {
      case "/erome": pageKey = "erome"; break;
      case "/tiktok": pageKey = "tiktok"; break;
      case "/youtube": pageKey = "youtube"; break;
      case "/instagram": pageKey = "instagram"; break;
      case "/": pageKey = "home"; break;
      case "/contact": pageKey = "contact"; break;
      case "/faq": pageKey = "faq"; break;
      default: console.log(`[SPA] No hay mapeo de inicializador para la ruta: ${currentPage}`); break;
    }

    if (pageKey && typeof window.pageInitializers[pageKey] === "function") {
      try { window.pageInitializers[pageKey](); } catch (e) { console.error(`[SPA] Error ejecutando inicializador para '${pageKey}':`, e); }
    } else if (pageKey) {
      console.warn(`[SPA] Se esperaba un inicializador para '${pageKey}', pero no es una función o no existe.`);
    }
  }

  // --- initializeAnimationsForContent ---
  function initializeAnimationsForContent(container) {
    if (!container) return;
    const elements = container.querySelectorAll(".animate, .animate-on-scroll");
    elements.forEach((el) => {
      el.classList.remove("animate");
      el.classList.add("animate-on-scroll");
    });
    requestAnimationFrame(animateVisibleElements);
  }

  // --- handlePopState ---
  function handlePopState(event) {
    const path = event.state ? event.state.path : window.location.pathname;
    console.log(`[SPA] Popstate detectado. Path: ${path}. Estado:`, event.state);
    if (path && path !== currentPage) {
      loadPageContent(path, true);
    } else if (!event.state && path === "/" && currentPage !== "/") {
      loadPageContent("/", true);
    } else { /* No recargar si es la misma página o caso no manejado*/ }
  }

  // --- updateActiveLink ---
  function updateActiveLink() {
    navigationLinks.forEach((link) => {
      if (!link) return;
      const linkPath = link.getAttribute("href");
      const icon = link.querySelector("i");
      const isCurrentPage = linkPath === currentPage || (currentPage === "/" && linkPath === "/");
      if (icon) {
        icon.classList.toggle("active", isCurrentPage);
      } else {
        link.classList.toggle("active", isCurrentPage);
      }
    });
  }

  // --- isElementInViewport ---
  function isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0);
  }

  // --- animateVisibleElements ---
  function animateVisibleElements() {
    const elementsToAnimate = document.querySelectorAll(".animate-on-scroll");
    elementsToAnimate.forEach((element) => {
      if (element.classList.contains("animate-on-scroll") && !element.classList.contains("animate") && isElementInViewport(element)) {
        element.classList.add("animate");
        element.classList.remove("animate-on-scroll");
      }
    });
  }

  // --- applyTheme ---
  function applyTheme(preference) {
    let actualTheme = preference === "light" || preference === "dark" ? preference : (mediaQuery.matches ? "dark" : "light");
    document.body.classList.toggle("dark-mode", actualTheme === "dark");
    if (themeToggle) themeToggle.innerHTML = actualTheme === "dark" ? moonIcon : sunIcon;
    localStorage.setItem("themePreference", preference);
    if (themeDropdown) {
      themeDropdown.querySelectorAll("li").forEach(li => li.classList.toggle("selected", li.dataset.theme === preference));
    }
  }

  // --- handleSystemThemeChange ---
  function handleSystemThemeChange() {
    const currentPreference = localStorage.getItem("themePreference") || "system";
    if (currentPreference === "system") applyTheme("system");
  }

  // --- handleHeaderScroll ---
  function handleHeaderScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 50);
  }

  // --- toggleMenu ---
  function toggleMenu() {
    if (navigationMenu) {
      const isOpen = navigationMenu.classList.toggle("open");
      document.body.classList.toggle("mobile-menu-open", isOpen);
      menuToggle?.setAttribute("aria-expanded", isOpen.toString());
    } else {
      console.error("[Menu] Elemento #navigation-menu no encontrado.");
    }
  }

  // --- updatePageTitle ---
  function updatePageTitle() {
    if (!titleElement) return;
    let newTitle = "UnivDown";
    let pageName = "";
    const defaultTitles = {
      "/": "UnivDown",
      "/youtube": "YouTube | UnivDown",
      "/tiktok": "TikTok | UnivDown",
      "/instagram": "Instagram | UnivDown",
      "/erome": "Erome | UnivDown",
      "/contact": "Contact | UnivDown",
      "/faq": "FAQ | UnivDown"
    };

    try {
      // Intentar usar i18next si está disponible
      if (window.i18next && window.i18next.isInitialized) {
         const keyMap = {
           "/": "pageTitle_home",
           "/youtube": "pageTitle_youtube",
           "/tiktok": "pageTitle_tiktok",
           "/instagram": "pageTitle_instagram",
           "/erome": "pageTitle_erome",
           "/contact": "pageTitle_contact",
           "/faq": "pageTitle_faq",
         };
         const tKey = keyMap[currentPage];
         if (tKey) {
           pageName = i18next.t(tKey, currentPage.substring(1) || 'Home');
           newTitle = currentPage === "/" ? "UnivDown" : `${pageName} | UnivDown`;
         } else {
             pageName = currentPage.substring(1) || "Page";
             newTitle = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} | UnivDown`;
         }
      } else {
         // Fallback a títulos predeterminados si i18next no está listo
         newTitle = defaultTitles[currentPage] || `${currentPage.substring(1).charAt(0).toUpperCase() + currentPage.slice(2)} | UnivDown`;
         console.warn("[i18n] i18next no disponible o inicializado. Usando títulos por defecto.");
      }
    } catch (e) {
      console.error("Error al actualizar título:", e);
      // Fallback adicional en caso de error inesperado
      newTitle = defaultTitles[currentPage] || "UnivDown";
    }
    titleElement.textContent = newTitle;
  }

  // *** Funciones para el botón Scroll-to-Top ***
  function handleScrollTopVisibility() {
    if (!scrollToTopButton) return;
    const scrollThreshold = window.innerHeight * 0.3;
    if (window.scrollY > scrollThreshold) {
      scrollToTopButton.classList.add("show");
    } else {
      scrollToTopButton.classList.remove("show");
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- INICIALIZACIÓN y EVENT LISTENERS ---
  // 1. Scroll Restoration
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // 2. Aplicar Tema Inicial
  applyTheme(localStorage.getItem("themePreference") || "system");

  // 3. Listener para cambios de tema del sistema
  mediaQuery.addEventListener("change", handleSystemThemeChange);

  // 4. Listeners Menú Desplegable de Temas
  if (themeToggle && themeDropdown) {
    themeToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = themeDropdown.classList.toggle("open");
      themeToggle.setAttribute("aria-expanded", isOpen.toString());
      if (languageDropdown) languageDropdown.classList.remove("open");
      languageButton?.setAttribute("aria-expanded", "false");
    });
    themeDropdown.addEventListener("click", (event) => {
      const target = event.target.closest("li[data-theme]");
      if (target) {
        applyTheme(target.dataset.theme);
        themeDropdown.classList.remove("open");
        themeToggle.setAttribute("aria-expanded", "false");
        themeToggle.focus();
      }
    });
  } else {
    console.warn("[UI] Elementos del toggle de tema no encontrados.");
  }

  // 5. Listeners Menú Desplegable de Idiomas
  if (languageButton && languageDropdown) {
    languageButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = languageDropdown.classList.toggle("open");
      languageButton.setAttribute("aria-expanded", isOpen.toString());
      if (themeDropdown) themeDropdown.classList.remove("open");
      themeToggle?.setAttribute("aria-expanded", "false");
    });
    languageDropdown.addEventListener("click", (event) => {
      const target = event.target.closest("li[data-lang]");
      if (target) {
        const lang = target.dataset.lang;
        languageDropdown.querySelectorAll("li").forEach(li => li.classList.toggle("selected", li.dataset.lang === lang));
        languageDropdown.classList.remove("open");
        languageButton.setAttribute("aria-expanded", "false");
        languageButton.focus();
        if (window.i18next && typeof window.i18next.changeLanguage === "function") {
          console.log(`[i18n] Cambiando idioma a: ${lang}`);
          window.i18next.changeLanguage(lang)
            .then(() => {
              console.log("[i18n] Idioma cambiado. Recargando contenido actual...");
              loadPageContent(currentPage);
              updatePageTitle();
            })
            .catch(err => console.error("[i18n] Error al cambiar idioma:", err));
        } else {
          console.warn("[i18n] i18next.changeLanguage no disponible.");
        }
      }
    });
  } else {
    console.warn("[UI] Elementos del selector de idioma no encontrados.");
  }

  // 6. Listener Scroll Combinado (Header, Animaciones, Scroll-to-Top)
  function handleCombinedScroll() {
    handleHeaderScroll();
    animateVisibleElements();
    handleScrollTopVisibility();
  }
  handleCombinedScroll();
  window.addEventListener("scroll", handleCombinedScroll, { passive: true });


  // 7. Listeners Menú Hamburguesa (Móvil)
  if (menuToggle && closeMenu && navigationMenu) {
    menuToggle.addEventListener("click", toggleMenu);
    closeMenu.addEventListener("click", toggleMenu);
  } else {
    console.warn("[UI] Elementos del menú hamburguesa no encontrados.");
  }

  // 8. Listener Global para cerrar Menús/Dropdowns
  window.addEventListener("click", (e) => {
    if (themeDropdown?.classList.contains("open") && !themeToggle?.contains(e.target) && !themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove("open"); themeToggle.setAttribute("aria-expanded", "false");
    }
    if (languageDropdown?.classList.contains("open") && !languageButton?.contains(e.target) && !languageDropdown.contains(e.target)) {
      languageDropdown.classList.remove("open"); languageButton.setAttribute("aria-expanded", "false");
    }
    if (navigationMenu?.classList.contains("open") && !menuToggle?.contains(e.target) && !navigationMenu.contains(e.target)) {
      toggleMenu();
    }
  });

  // 9. Listener Navegación SPA para Enlaces Internos
  document.body.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) {
      const href = link.getAttribute("href");
      const isInternalNav = href && (href.startsWith("/") || link.origin === window.location.origin) && !href.startsWith("/api/") && link.target !== "_blank" && !link.hasAttribute("download") && !href.startsWith("mailto:") && !href.startsWith("tel:") && !link.classList.contains("no-spa");

      if (isInternalNav) {
        event.preventDefault();
        if (href !== currentPage) {
          loadPageContent(href);
        } else if (navigationMenu?.classList.contains("open")) {
          toggleMenu(); // Cierra menú si se clickea en el link actual
        }
      } else if (href && navigationMenu?.classList.contains("open") && (link.target === "_blank" || link.origin !== window.location.origin)) {
         toggleMenu(); // Cierra menú en clicks de enlaces externos también
      }
    }
  });

  // 10. Listener Popstate para botones Atrás/Adelante
  window.addEventListener("popstate", handlePopState);

  // 11. *** NUEVO: Listener para el clic en el botón Scroll-to-Top ***
  if (scrollToTopButton) {
    scrollToTopButton.addEventListener("click", scrollToTop);
  } else {
    console.warn("[UI] Botón Scroll-to-Top (#scrollToTopBtn) no encontrado.");
  }

  // Revisar si el consentimiento ya fue dado
  if (!localStorage.getItem('cookieConsentGiven')) {
    banner.style.display = 'block';
  }

  acceptButton.addEventListener('click', function() {
      localStorage.setItem('cookieConsentGiven', 'true'); // Usamos localStorage, pero podrías usar una cookie también
      banner.style.display = 'none';
  });

  // 12. Estado Inicial del Historial
  history.replaceState({ path: currentPage }, "", currentPage);

  // 13. Establecer Título Inicial y Enlace Activo al cargar
  updatePageTitle();
  updateActiveLink();

  // 14. Ejecutar scripts para la página cargada inicialmente
  executePageScripts();
});