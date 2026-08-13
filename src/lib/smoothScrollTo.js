const NAV_OFFSET = 80; // matches .section's scroll-mt-20 (5rem)

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function smoothScrollTo(id, duration = 1000) {
  const el = document.getElementById(id);
  if (!el) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.scrollIntoView();
    return;
  }

  const startY = window.scrollY;
  const targetY = Math.max(0, el.getBoundingClientRect().top + startY - NAV_OFFSET);
  const distance = targetY - startY;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutQuad(progress));
    if (progress < 1) requestAnimationFrame(step);
    else history.replaceState(null, "", `#${id}`);
  }

  requestAnimationFrame(step);
}
