export function showLoading(text = "Cargando...") {
  let overlay = document.getElementById('loadingOverlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <p id="loadingText">${text}</p>
    `;
    document.body.appendChild(overlay);
  } else {
    document.getElementById("loadingText").innerText = text;
  }

  overlay.classList.add('active');
}

export function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}