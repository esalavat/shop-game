// Short friendly messages that float in below the HUD and fade away.

const SHOW_MS = 2400;

export function createToaster() {
  const root = document.getElementById('toasts');
  return function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    root.append(el);
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => {
      el.classList.add('out');
      el.addEventListener('animationend', () => el.remove());
    }, SHOW_MS);
  };
}
