// js/panel.js
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderPanel(container, ecole, { onNavigate, filiationsFrom }) {
  if (!ecole) {
    container.classList.remove('panel--open');
    container.innerHTML = '';
    return;
  }

  const related = filiationsFrom(ecole.id);

  container.innerHTML = `
    <button class="panel-close" aria-label="Fermer">&times;</button>
    <h2 class="panel-title">${escapeHTML(ecole.nom)}</h2>
    <p class="panel-meta">${escapeHTML(ecole.region)} · ${ecole.periode.debut}${ecole.periode.fin ? '–' + ecole.periode.fin : ''}</p>
    <h3>Auteurs</h3>
    <p>${ecole.auteurs.map(escapeHTML).join(', ')}</p>
    <h3>Logique</h3>
    <p>${escapeHTML(ecole.logique)}</p>
    ${ecole.citation_cle ? `<blockquote>${escapeHTML(ecole.citation_cle)}</blockquote>` : ''}
    <h3>Sources</h3>
    <ul>${ecole.sources.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
    ${related.length ? `<h3>Écoles liées</h3><ul class="panel-links">${related.map(r => `<li><button class="panel-link" data-id="${escapeHTML(r.id)}">${escapeHTML(r.nom)}</button></li>`).join('')}</ul>` : ''}
  `;
  container.classList.add('panel--open');

  container.querySelector('.panel-close').addEventListener('click', () => onNavigate(null));
  container.querySelectorAll('.panel-link').forEach(btn => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.id));
  });
}
