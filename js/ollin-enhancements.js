/* Mejoras progresivas de Ollin: accesibilidad, navegación y búsqueda. */
(() => {
  'use strict';

  const init = () => {
    const main = document.querySelector('main');
    const skipLink = document.createElement('a');
    skipLink.href = '#contenido-principal';
    skipLink.className = 'ollin-skip-link';
    skipLink.textContent = 'Saltar al contenido';
    if (main) {
      if (!main.id) main.id = 'contenido-principal';
      skipLink.href = '#' + main.id;
      document.body.prepend(skipLink);
    }

    // Navegación lateral: conservar openNav/closeNav y añadir soporte de teclado.
    const open = document.getElementById('openBtn');
    const close = document.getElementById('closeBtn');
    const modal = document.getElementById('modalSidebar');
    if (open && modal) {
      open.setAttribute('role', 'button');
      open.setAttribute('tabindex', '0');
      open.setAttribute('aria-label', 'Abrir menú de navegación');
      open.setAttribute('aria-controls', 'modalSidebar');
      open.setAttribute('aria-expanded', 'false');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Menú de navegación');
      if (close) close.setAttribute('aria-label', 'Cerrar menú');
      const setExpanded = (value) => {
        open.setAttribute('aria-expanded', String(value));
        if (value && close) close.focus({ preventScroll: true });
        if (!value) open.focus({ preventScroll: true });
      };
      open.addEventListener('click', () => setExpanded(true));
      open.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open.click();
        }
      });
      if (close) close.addEventListener('click', () => setExpanded(false));
      modal.addEventListener('click', (event) => {
        if (event.target === modal && typeof window.closeNav === 'function') {
          window.closeNav();
          setExpanded(false);
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && open.getAttribute('aria-expanded') === 'true') {
          if (typeof window.closeNav === 'function') window.closeNav();
          setExpanded(false);
        }
      });
    }
    const currentPath = decodeURIComponent(location.pathname).replace(/\/$/, '').toLowerCase();
    document.querySelectorAll('.btn-sidebar[href]').forEach((link) => {
      try {
        const target = new URL(link.href).pathname.replace(/\/$/, '').toLowerCase();
        if (target === currentPath) link.setAttribute('aria-current', 'page');
      } catch (_) { /* Enlaces externos o incompletos. */ }
    });

    // Red visual de apoyo: nunca sustituye la validación real de la API.
    let networkBanner;
    const updateNetworkState = () => {
      if (!navigator.onLine) {
        if (!networkBanner) {
          networkBanner = document.createElement('div');
          networkBanner.className = 'ollin-network-alert';
          networkBanner.setAttribute('role', 'status');
          document.body.append(networkBanner);
        }
        networkBanner.textContent = 'Sin conexión a Internet. Comprueba tu red para cargar museos y guardar cambios.';
      } else if (networkBanner) {
        networkBanner.remove();
        networkBanner = null;
      }
    };
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);
    updateNetworkState();

    if (main) {
      const backtop = document.createElement('button');
      backtop.type = 'button';
      backtop.className = 'ollin-backtop';
      backtop.textContent = '↑';
      backtop.setAttribute('aria-label', 'Volver al inicio de la página');
      backtop.title = 'Volver arriba';
      document.body.append(backtop);
      const updateScroll = () => backtop.classList.toggle('is-visible',
        Math.max(window.scrollY, main.scrollTop) > 450);
      backtop.addEventListener('click', () => {
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        main.scrollTo({ top: 0, behavior });
        window.scrollTo({ top: 0, behavior });
      });
      window.addEventListener('scroll', updateScroll, { passive: true });
      main.addEventListener('scroll', updateScroll, { passive: true });
      updateScroll();
    }

    // Atajos para filtros preexistentes: se activan mediante el botón oficial "Aplicar".
    const search = document.getElementById('searchMuseoInput');
    const filtersSubmit = document.getElementById('filterSend');
    const filtersErase = document.getElementById('filterErase');
    const controls = document.querySelector('.museums-controls');
    if (search && controls && filtersSubmit) {
      search.setAttribute('aria-label', 'Buscar museos por nombre');
      search.setAttribute('autocomplete', 'off');
      const row = document.createElement('div');
      row.className = 'ollin-filter-row';
      row.innerHTML = '<span class="ollin-filter-label">Explora rápido:</span>' +
        '<button class="ollin-filter-chip" type="button" data-ollin-filter="all">Todos</button>' +
        '<button class="ollin-filter-chip" type="button" data-ollin-filter="free">Entrada gratis</button>' +
        '<button class="ollin-filter-chip" type="button" data-ollin-filter="open">Abiertos ahora</button>' +
        '<button class="ollin-filter-chip" type="button" data-ollin-filter="discount">Con descuentos</button>';
      controls.after(row);

      const filterLabels = {
        es: ['Explora rápido:', 'Todos', 'Entrada gratis', 'Abiertos ahora', 'Con descuentos'],
        en: ['Quick filters:', 'All', 'Free admission', 'Open now', 'Discounts'],
        it: ['Filtri rapidi:', 'Tutti', 'Ingresso gratuito', 'Aperti ora', 'Sconti'],
        fr: ['Filtres rapides :', 'Tous', 'Entrée gratuite', 'Ouverts', 'Réductions']
      };
      const applyFilterLanguage = () => {
        const lang = document.getElementById('lang-select')?.value || 'es';
        const labels = filterLabels[lang] || filterLabels.es;
        const caption = row.querySelector('.ollin-filter-label');
        if (caption) caption.textContent = labels[0];
        row.querySelectorAll('button').forEach((button, index) => {
          button.textContent = labels[index + 1];
        });
      };
      applyFilterLanguage();
      document.getElementById('lang-select')?.addEventListener('change', applyFilterLanguage);

      const filterIds = {
        free: 'filterAlwaysFree',
        open: 'filter-abierto-ahora',
        discount: 'filterHasDiscounts'
      };
      const sync = () => {
        const active = Object.entries(filterIds)
          .filter(([, id]) => document.getElementById(id)?.checked).map(([key]) => key);
        row.querySelectorAll('button').forEach((btn) => {
          const pressed = btn.dataset.ollinFilter === 'all' ? active.length === 0 :
            active.includes(btn.dataset.ollinFilter);
          btn.setAttribute('aria-pressed', String(pressed));
        });
      };
      row.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-ollin-filter]');
        if (!btn) return;
        const target = btn.dataset.ollinFilter;
        if (target === 'all') {
          filtersErase?.click();
        } else {
          // Los filtros avanzados ajenos al atajo (alcaldía, precio, etc.) se conservan.
          Object.entries(filterIds).forEach(([key, id]) => {
            const cb = document.getElementById(id);
            if (cb) cb.checked = key === target;
          });
          filtersSubmit.click();
        }
        sync();
      });
      filtersSubmit.addEventListener('click', sync);
      filtersErase?.addEventListener('click', sync);
      sync();

      const container = document.getElementById('museodes');
      if (container) {
        const summary = document.createElement('p');
        summary.className = 'ollin-results-summary';
        summary.setAttribute('role', 'status');
        summary.setAttribute('aria-live', 'polite');
        row.after(summary);
        const updateCount = () => {
          const number = container.querySelectorAll('.favorite-card').length;
          if (number) summary.textContent = number + (number === 1 ? ' museo disponible' : ' museos disponibles') + ' para explorar';
          else if (container.querySelector('.error-message')) summary.textContent = 'No fue posible cargar los museos';
          else if (container.querySelector('.loading-state')) summary.textContent = 'Cargando museos…';
          else summary.textContent = container.textContent.trim() ? 'Sin resultados para esta búsqueda' : 'Preparando los museos…';
        };
        const observer = new MutationObserver(updateCount);
        observer.observe(container, { childList: true });
        updateCount();
      }
    }

    const filterIcon = document.getElementById('filter-icon');
    if (filterIcon) {
      filterIcon.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          filterIcon.click();
        }
      });
    }

    // Iconos existentes, accesibles también con teclado.
    document.querySelectorAll('#togglePassword, #togglePasswordRE').forEach((icon) => {
      icon.setAttribute('role', 'button');
      icon.setAttribute('tabindex', '0');
      icon.setAttribute('aria-label', 'Mostrar u ocultar contraseña');
      icon.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          icon.click();
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else init();
})();
