// Modal focus & hash management for :target modal pattern
document.addEventListener('DOMContentLoaded', function() {
  const MAIN_CONTENT_ID = 'mainContent';
  const MODAL_ID = 'flyer-modal';
  const modal = document.getElementById(MODAL_ID);
  const modalPanel = modal ? modal.querySelector('.modal-content') : null;
  const closeLink = modal ? modal.querySelector('.modal-close') : null;
  let lastFocused = null;

  function isModalOpen() {
    return window.location.hash === '#' + MODAL_ID || modal.classList.contains('visible');
  }

  // Improved freeze/unfreeze that preserves scroll position
  let _savedScrollY = 0;
  function freezeScroll(enable) {
    if (enable) {
      _savedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.classList.add('freeze-scroll');
      // Use top offset to preserve visual position when body becomes fixed
      document.body.style.top = `-${_savedScrollY}px`;
      console.debug('freezeScroll enabled, savedScrollY=', _savedScrollY, 'body classes=', document.body.className);
    } else {
      document.body.classList.remove('freeze-scroll');
      // Remove the top style and restore scroll position
      const top = document.body.style.top || '';
      document.body.style.top = '';
      const restoreY = _savedScrollY || 0;
      window.scrollTo(0, restoreY);
      console.debug('freezeScroll disabled, restored to', restoreY, 'body classes=', document.body.className);
      _savedScrollY = 0;
    }
  }

  function openModal() {
    // Save last focused element to restore later
    lastFocused = document.activeElement;
    freezeScroll(true);
    // move focus to modal panel (or first focusable inside)
    if (modalPanel) {
      const focusable = modalPanel.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
      (focusable || modalPanel).focus();
    }
    // Mark main as inert for screen readers (aria-hidden)
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (main) main.setAttribute('aria-hidden', 'true');
    // Ensure any JS-forced hidden class is removed when opening
    if (modal) modal.classList.remove('js-hidden');
  }

  function closeModal() {
    // Clear the hash without adding history entry where supported
    if (history.replaceState) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    } else {
      // fallback: set to empty hash
      window.location.hash = '';
    }
    freezeScroll(false);
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (main) main.removeAttribute('aria-hidden');
    // Force-hide as a backup in case :target styles don't update quickly
    if (modal) modal.classList.add('js-hidden');
    // restore focus
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    // Refresh the page after closing to fully reset state (small delay)
    setTimeout(function() { window.location.reload(); }, 80);
  }

  // Respond to hashchange and initial load
  function checkModalHash() {
    if (isModalOpen()) {
      openModal();
      // Lazy-load the PDF manifest and render list when modal opens
      loadPdfManifest();
    } else {
      freezeScroll(false);
    }
  }

  window.addEventListener('hashchange', checkModalHash);
  window.addEventListener('DOMContentLoaded', checkModalHash);
  window.addEventListener('hashchange', function() { console.debug('hashchange event, new hash=', window.location.hash); });
  checkModalHash();

  // Close link: when clicked, close modal (clear hash)
  if (closeLink) {
    closeLink.addEventListener('click', function(e) {
      e.preventDefault();
      console.debug('modal close clicked');
      closeModal();
    });
  }

  // Escape to close when modal is open
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isModalOpen()) {
      closeModal();
    }
  });

  // Simple focus trap for modal when open (Tab / Shift+Tab)
  document.addEventListener('keydown', function(e) {
    if (!isModalOpen()) return;
    if (e.key !== 'Tab') return;
    const focusable = modalPanel.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ===== PDF manifest + viewer ===== */
  let manifestLoaded = false;
  let targetProject = null;

  // Capture which project should open when modal is triggered via a link
  document.querySelectorAll('.modal-open[data-project]').forEach(function(el) {
    el.addEventListener('click', function() {
      targetProject = el.getAttribute('data-project');
    });
  });

  function expandOnlyProject(projectId) {
    const groups = document.querySelectorAll('.pdf-project-group');
    groups.forEach(g => {
      const header = g.querySelector('.project-header');
      const body = g.querySelector('.project-body');
      if (!header || !body) return;
      if (g.dataset.projectId === projectId) {
        header.setAttribute('aria-expanded', 'true');
        body.style.display = 'block';
      } else {
        header.setAttribute('aria-expanded', 'false');
        body.style.display = 'none';
      }
    });
  }

  function loadPdfManifest() {
    if (manifestLoaded) return;
    const manifestPath = 'assets/pdfs/manifest.json';
    const listContainer = document.getElementById('pdfList');
    if (listContainer) listContainer.innerHTML = '<p class="muted">Loading documents…</p>';
    fetch(manifestPath)
      .then(res => {
        if (!res.ok) throw new Error('Manifest fetch failed: ' + res.status + ' ' + res.statusText);
        return res.json();
      })
      .then(list => {
        renderPdfList(list);
        manifestLoaded = true;
        if (targetProject) {
          expandOnlyProject(targetProject);
          // If the targeted project has docs, open the first one
          const project = list.find(p => p.projectId === targetProject);
          if (project && project.docs && project.docs[0]) {
            setTimeout(() => openPdfInViewer(project.docs[0]), 60);
          }
        }
      })
      .catch(err => {
        console.error('Error loading PDF manifest:', err);
        if (listContainer) {
          listContainer.innerHTML = '';
          const p = document.createElement('p');
          p.className = 'muted';
          p.textContent = 'No documents available (failed to load manifest).';
          listContainer.appendChild(p);
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.textContent = 'Retry loading documents';
          retry.addEventListener('click', function() { loadPdfManifest(); });
          listContainer.appendChild(retry);
        }
        // keep manifestLoaded as false so user can retry
      });
  }

  function renderPdfList(list) {
    const listContainer = document.getElementById('pdfList');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    // Expecting grouped manifest: array of projects
    list.forEach(project => {
      const group = document.createElement('div');
      group.className = 'pdf-project-group';
      if (project.projectId) group.dataset.projectId = project.projectId;

      // Create body first so header listeners can reference it safely
      const body = document.createElement('div');
      body.className = 'project-body';
      body.style.display = 'none';

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'project-header';
      header.textContent = project.title;
      header.setAttribute('aria-expanded', 'false');
      header.addEventListener('click', function() {
        const expanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        body.style.display = expanded ? 'none' : 'block';
      });

      // Render docs
      (project.docs || []).forEach(item => {
  const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pdf-item';
        btn.setAttribute('data-filename', item.filename);
        btn.setAttribute('aria-label', item.title + (item.description ? ' — ' + item.description : ''));
  // Tooltip/title for clarity
  btn.title = item.title + (item.description ? ' — ' + item.description : '');
        let thumbHtml = '<div class="pdf-icon">PDF</div>';
        if (item.thumbnail) {
          const src = item.thumbnail;
          const src2 = item.thumbnail2x || null;
          const srcset = src2 ? `${src} 1x, ${src2} 2x` : undefined;
          const srcsetAttr = srcset ? ` srcset="${srcset}"` : '';
          thumbHtml = `<img src="${src}"${srcsetAttr} alt="${item.title} thumbnail" loading="lazy" width="120" height="80" />`;
        }
        btn.innerHTML = `<div class="thumb">${thumbHtml}</div><div class="meta"><strong>${item.title}</strong><div class="desc">${item.description || ''}</div></div>`;
        btn.addEventListener('click', function() { openPdfInViewer(item); });
        body.appendChild(btn);
      });

      group.appendChild(header);
      group.appendChild(body);
      listContainer.appendChild(group);
      // If this project matches the targetProject (from data-project) expand it and open first doc
      if (targetProject && project.projectId === targetProject) {
        header.setAttribute('aria-expanded', 'true');
        body.style.display = 'block';
        const firstDoc = (project.docs || [])[0];
        if (firstDoc) {
          // slight timeout to ensure UI paint
          setTimeout(() => openPdfInViewer(firstDoc), 60);
        }
      }
    });
  }

  function openPdfInViewer(item) {
    const iframe = document.getElementById('pdfViewer');
    const placeholder = document.getElementById('viewerPlaceholder');
    const download = document.getElementById('pdfDownload');
    const openNew = document.getElementById('pdfOpenNew');
    if (iframe) {
      iframe.src = item.filename;
      iframe.style.display = 'block';
      iframe.removeAttribute('aria-hidden');
    }
    if (placeholder) placeholder.style.display = 'none';
    if (download) { download.href = item.filename; download.setAttribute('download', ''); }
    if (openNew) openNew.href = item.filename;
    // Highlight selected item in the list
    document.querySelectorAll('.pdf-item.selected').forEach(el => el.classList.remove('selected'));
    const selector = `.pdf-item[data-filename="${CSS.escape(item.filename)}"]`;
    const active = document.querySelector(selector);
    if (active) active.classList.add('selected');
    // Move focus to modal content for accessibility
    const modalPanel = document.querySelector('.modal-content');
    if (modalPanel) modalPanel.focus();
  }

  // Image fallback: replace broken preview images with a placeholder
  function makeImgPlaceholder(title) {
    const div = document.createElement('div');
    div.className = 'img-placeholder';
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', title || 'No preview available');
    div.innerHTML = '<svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="120" height="80" fill="#f4f0e6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="10">No preview</text></svg>';
    return div;
  }

  document.querySelectorAll('.flyer-img').forEach(img => {
    img.addEventListener('error', function() {
      const parent = img.parentElement;
      const placeholder = makeImgPlaceholder(img.alt || 'Preview not available');
      img.replaceWith(placeholder);
    });
  });
});