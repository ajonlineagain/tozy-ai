/**
 * TOZY.AI — Toast Notification Utility
 * Standalone module to avoid circular imports between app.js and page modules.
 */

export function showToast(message, type = 'accent', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { bull: '✅', bear: '🔴', accent: '⚡', warning: '⚠️', warn: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '⚡'}</span><span style="flex:1;">${message}</span><span style="color:var(--text-muted);font-size:10px;cursor:pointer;">✕</span>`;

  const dismiss = () => {
    toast.classList.add('exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };
  toast.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);

  container.appendChild(toast);
}
