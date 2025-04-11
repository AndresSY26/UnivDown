document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos DOM ---
  const contentElement = document.getElementById("content");
  const header = document.getElementById("header");
  // Asegúrate de que estos selectores coincidan con tu HTML del header INCLUIDO
  const navigationLinks = document.querySelectorAll("#navigation-menu .social-links a, .logo-container a");
  const titleElement = document.querySelector("title");

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
            // Añadir un timeout por si acaso el evento no dispara
            setTimeout(() => {
              resolve();
            }, 2000);
          });
        });
        await Promise.all(loadPromises);
      } else {
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

      // 6. Ejecutar scripts específicos de la página DESPUÉS de que el DOM esté listo y visible
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
        // Asegurarse de que sea visible en caso de error
        contentElement.classList.remove("fade-out");
        contentElement.style.opacity = "1";
        contentElement.style.transition = "";
      }
    } finally {
      isLoading = false;
    }
  }

  // --- executePageScripts (MODIFICADO para Enfoque 1) ---
  function executePageScripts() {
    // 1. Verifica si el objeto global de inicializadores existe
    if (
      typeof window.pageInitializers !== "object" ||
      window.pageInitializers === null
    ) {
      console.warn("[SPA] Objeto window.pageInitializers no encontrado. Scripts específicos de página no se ejecutarán.");
      // Intenta inicializar la UI común igualmente si existe
      if (typeof window.initializeMediaUI === "function") {
        try {
          console.log("[SPA] Intentando inicializar Media UI (sin pageInitializers)...");
          window.initializeMediaUI();
        } catch (e) {
          console.error("[SPA] Error inicializando Media UI:", e);
        }
      }
      return;
    }

    // 3. (Re)Inicializa la UI común si existe y es necesario
    //    (Asegúrate que 'initializeMediaUI' pueda llamarse varias veces sin problemas)
    if (typeof window.initializeMediaUI === "function") {
      try {
        window.initializeMediaUI();
      } catch (e) {
        console.error("[SPA] Error llamando initializeMediaUI:", e);
      }
    } else {
    }

    // 4. Llama al inicializador específico basado en currentPage
    let initializerToCall = null;
    let pageKey = "";

    // Mapeo simple de ruta a clave en pageInitializers
    switch (currentPage) {
      case "/erome":
        pageKey = "erome";
        break;
      case "/tiktok":
        pageKey = "tiktok";
        break;
      case "/youtube":
        pageKey = "youtube";
        break;
      case "/instagram":
        pageKey = "instagram";
        break;
      case "/":
        pageKey = "home";
        break;

      // Enlaces de footer
      case "/contact":
        pageKey = "contact";
        break;
      case "/faq":
        pageKey = "faq";
        break;
      default:
        console.log(`[SPA] No hay mapeo de inicializador definido para la ruta: ${currentPage}`);
        break;
    }

    if (pageKey && typeof window.pageInitializers[pageKey] === "function") {
      initializerToCall = window.pageInitializers[pageKey];
      try {
        initializerToCall();
      } catch (e) {
        console.error(`[SPA] Error ejecutando el inicializador para '${pageKey}':`,e);
      }
    } else if (pageKey) {
      console.warn(`[SPA] Se esperaba un inicializador para '${pageKey}', pero window.pageInitializers.${pageKey} no es una función o no existe.`);
    }
  }

  // --- initializeAnimationsForContent ---
  function initializeAnimationsForContent(container) {
    if (!container) return;
    // Reinicia elementos que pudieron haber sido animados en cargas anteriores
    const elements = container.querySelectorAll(".animate, .animate-on-scroll");
    elements.forEach((el) => {
      el.classList.remove("animate");
      el.classList.add("animate-on-scroll");
    });
    // Ejecuta una vez por si algo ya está visible
    requestAnimationFrame(animateVisibleElements);
  }

  // --- handlePopState ---
  function handlePopState(event) {
    const path = event.state ? event.state.path : window.location.pathname;
    console.log(`[SPA] Popstate detectado. Nuevo path: ${path}. Estado:`,event.state);
    if (path && path !== currentPage) {
      console.log(`[SPA] Popstate: Cargando contenido para ${path} (viene de popstate)`);
      loadPageContent(path, true);
    } else if (!event.state && path === "/" && currentPage !== "/") {
      console.log("[SPA] Popstate: Volviendo a '/' (sin estado previo).");
      loadPageContent("/", true);
    } else if (path === currentPage) {
      console.log("[SPA] Popstate: Path es el mismo que currentPage, no se recarga.");
    } else {
      console.log("[SPA] Popstate: Caso no manejado o path nulo.");
    }
  }

  // --- updateActiveLink (Sin cambios) ---
  function updateActiveLink() {
    navigationLinks.forEach((link) => {
      if (!link) return;
      const linkPath = link.getAttribute("href");
      const icon = link.querySelector("i");
      // Considerar '/' como caso especial
      const isCurrentPage = linkPath === currentPage || (currentPage === "/" && linkPath === "/");

      if (icon) {
        icon.classList.toggle("active", isCurrentPage);
      } else {
        link.classList.toggle("active", isCurrentPage);
      }
    });
  }

  // --- isElementInViewport (Sin cambios) ---
  function isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.bottom > 0 && rect.right > 0);
  }

  // --- animateVisibleElements (Sin cambios, considera debounce/throttle si hay problemas de rendimiento) ---
  function animateVisibleElements() {
    const elementsToAnimate = document.querySelectorAll(".animate-on-scroll");
    elementsToAnimate.forEach((element) => {
      // Doble chequeo por si acaso, ya tiene 'animate' no hacer nada
      if (
        element.classList.contains("animate-on-scroll") &&
        !element.classList.contains("animate") &&
        isElementInViewport(element)
      ) {
        element.classList.add("animate");
        element.classList.remove("animate-on-scroll");
      }
    });
  }

  // --- applyTheme ---
  function applyTheme(preference) {
    let actualTheme;
    if (preference === "light") {
      actualTheme = "light";
    } else if (preference === "dark") {
      actualTheme = "dark";
    } else {
      actualTheme = mediaQuery.matches ? "dark" : "light";
    }

    document.body.classList.toggle("dark-mode", actualTheme === "dark");
    if (themeToggle) {
      themeToggle.innerHTML = actualTheme === "dark" ? moonIcon : sunIcon;
    }
    localStorage.setItem("themePreference", preference);

    // Actualiza la selección en el dropdown
    if (themeDropdown) {
      themeDropdown.querySelectorAll("li").forEach((li) => {
        li.classList.toggle("selected", li.dataset.theme === preference);
      });
    }
  }

  // --- handleSystemThemeChange (Sin cambios) ---
  function handleSystemThemeChange() {
    const currentPreference =
      localStorage.getItem("themePreference") || "system";
    if (currentPreference === "system") {
      applyTheme("system");
    } else {
    }
  }

  // --- handleHeaderScroll ---
  function handleHeaderScroll() {
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 50);
    }
  }

  // --- toggleMenu ---
  function toggleMenu() {
    if (navigationMenu) {
      const isOpen = navigationMenu.classList.toggle("open");
      // Podrías añadir/quitar una clase al body para evitar scroll cuando el menú está abierto
      document.body.classList.toggle("mobile-menu-open", isOpen);
      // Gestionar ARIA
      menuToggle?.setAttribute("aria-expanded", isOpen.toString());
    } else {
      console.error("[Menu] Elemento #navigation-menu no encontrado.");
    }
  }

  // --- updatePageTitle (Sin cambios) ---
  function updatePageTitle() {
    if (!titleElement) return;
    let newTitle = "UnivDown";
    // Asumiendo i18next YA está configurado y listo
    let pageName = "";
    try {
      switch (currentPage) {
        case "/":
          pageName = i18next.t("pageTitle_home", "Home");
          break;
        case "/youtube":
          pageName = i18next.t("pageTitle_youtube", "YouTube");
          break;
        case "/tiktok":
          pageName = i18next.t("pageTitle_tiktok", "TikTok");
          break;
        case "/instagram":
          pageName = i18next.t("pageTitle_instagram", "Instagram");
          break;
        case "/erome":
          pageName = i18next.t("pageTitle_erome", "Erome");
          break;
        default:
          pageName = currentPage.substring(1) || "Page";
      }
      // Construye el título final
      newTitle = currentPage === "/" ? "UnivDown" : `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} | UnivDown`;
    } catch (e) {
      console.warn("i18next no disponible o error al obtener título traducido. Usando fallback.",e);
      // Fallback sin i18next
      switch (currentPage) {
        case "/":
          newTitle = "UnivDown";
          break;
        case "/youtube":
          newTitle = "YouTube | UnivDown";
          break;
        case "/tiktok":
          newTitle = "TikTok | UnivDown";
          break;
        case "/instagram":
          newTitle = "Instagram | UnivDown";
          break;
        case "/erome":
          newTitle = "Erome | UnivDown";
          break;
        default:
          newTitle = `${currentPage.substring(1) || "Page"} | UnivDown`;
      }
    }
    titleElement.textContent = newTitle;
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
      // Cerrar el otro menú si está abierto
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
      // Cerrar el otro menú si está abierto
      if (themeDropdown) themeDropdown.classList.remove("open");
      themeToggle?.setAttribute("aria-expanded", "false");
    });

    languageDropdown.addEventListener("click", (event) => {
      const target = event.target.closest("li[data-lang]");
      if (target) {
        const lang = target.dataset.lang;
        console.log("Idioma UI seleccionado:", lang);
        // Marca visualmente el seleccionado
        languageDropdown.querySelectorAll("li").forEach((li) => {
          li.classList.toggle("selected", li.dataset.lang === lang);
          li.setAttribute(
            "aria-current",
            li.dataset.lang === lang ? "true" : "false"
          );
        });
        languageDropdown.classList.remove("open");
        languageButton.setAttribute("aria-expanded", "false");
        languageButton.focus();

        // --- Aquí va la lógica de cambio de idioma ---
        if (
          window.i18next &&
          typeof window.i18next.changeLanguage === "function"
        ) {
          console.log(`[i18n] Cambiando idioma a: ${lang}`);
          window.i18next.changeLanguage(lang).then(() => {
              console.log("[i18n] Idioma cambiado con éxito. Recargando contenido actual para aplicar traducciones...");
              loadPageContent(currentPage);
              updatePageTitle();
            })
            .catch((err) =>
              console.error("[i18n] Error al cambiar idioma:", err)
            );
        } else {
          console.warn("[i18n] i18next.changeLanguage no está disponible.");
        }
      }
    });
  } else {
    console.warn("[UI] Elementos del selector de idioma no encontrados.");
  }

  // 6. Listener Scroll para efecto del Header
  // Llama una vez al inicio por si la página carga ya scrolleada
  handleHeaderScroll();
  // Usa passive: true para mejorar rendimiento del scroll
  window.addEventListener("scroll", handleHeaderScroll, { passive: true });

  // 7. Listener Scroll para Animaciones
  // Llama al inicio tras un breve delay para que todo se asiente
  setTimeout(animateVisibleElements, 150);
  window.addEventListener("scroll", animateVisibleElements, { passive: true });

  // 8. Listeners Menú Hamburguesa (Móvil)
  if (menuToggle && closeMenu && navigationMenu) {
    menuToggle.addEventListener("click", toggleMenu);
    closeMenu.addEventListener("click", toggleMenu);
  } else {
    console.warn("[UI] Elementos del menú hamburguesa no encontrados.");
  }

  // 9. Listener Global para cerrar Menús/Dropdowns si se hace clic fuera
  window.addEventListener("click", (e) => {
    // Cerrar menú tema si está abierto y no se hizo clic dentro de él o su botón
    if (themeDropdown?.classList.contains("open") && !themeToggle?.contains(e.target) && !themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove("open");
      themeToggle.setAttribute("aria-expanded", "false");
    }
    // Cerrar menú idioma
    if (languageDropdown?.classList.contains("open") && !languageButton?.contains(e.target) && !languageDropdown.contains(e.target)) {
      languageDropdown.classList.remove("open");
      languageButton.setAttribute("aria-expanded", "false");
    }
    // Cerrar menú hamburguesa (solo si se hace clic *fuera* del menú)
    if (navigationMenu?.classList.contains("open") && !menuToggle?.contains(e.target) && !navigationMenu.contains(e.target)) {
      console.log("[Menu] Clic fuera, cerrando menú.");
      toggleMenu();
    }
  });

  // 10. Listener Navegación SPA para Enlaces Internos
  document.body.addEventListener("click", (event) => {
    // Busca el enlace más cercano al elemento clickeado
    const link = event.target.closest("a");

    if (link) {
      const href = link.getAttribute("href");
      // No tiene clase 'no-spa' si quieres excluir enlaces
      const isInternalNav = href && (href.startsWith("/") || link.origin === window.location.origin) && !href.startsWith("/api/") && link.target !== "_blank" && !link.hasAttribute("download") && !href.startsWith("mailto:") && !href.startsWith("tel:") && !link.classList.contains("no-spa");

      if (isInternalNav) {
        event.preventDefault();
        if (href !== currentPage) {
          loadPageContent(href);
        } else {
          // Si el menú hamburguesa está abierto, ciérralo
          if (navigationMenu && navigationMenu.classList.contains("open")) {
            toggleMenu();
          }
        }
      } else if (href) {
        console.log(
          `[SPA] Enlace externo o no SPA detectado: ${href}. Dejando comportamiento por defecto.`
        );
        // Si es un enlace externo Y el menú está abierto, ciérralo
        if (navigationMenu && navigationMenu.classList.contains("open") && (link.target === "_blank" || link.origin !== window.location.origin)) {
          toggleMenu();
        }
      }
    }
  });

  // 11. Listener Popstate para botones Atrás/Adelante del navegador
  window.addEventListener("popstate", handlePopState);

  // 12. Estado Inicial del Historial
  // Reemplaza el estado actual para asegurar que tenemos un estado inicial asociado a la URL
  history.replaceState({ path: currentPage }, "", currentPage);

  // 13. Establecer Título Inicial y Enlace Activo al cargar
  updatePageTitle();
  updateActiveLink();

  // 14. (Opcional) Ejecutar scripts para la página cargada inicialmente
  // Útil si la lógica inicial no se ejecuta solo con DOMContentLoaded
  executePageScripts();
});