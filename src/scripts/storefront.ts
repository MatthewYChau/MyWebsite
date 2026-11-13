/**
 * Storefront entry.
 * The door, a scroll, or a key press plays the way in (about 3.5 seconds, timed in
 * Storefront.astro). "Skip", Escape, or a click during the animation goes straight in.
 * Either way the choice is remembered in localStorage, so returning visitors start
 * at the menu.
 */
const STORAGE_KEY = 'cct-entered';
/** Safety net in case the closing animation never reports back. */
const GIVE_UP_MS = 9000;

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage blocked: the storefront will simply show again next visit.
  }
}

function setup() {
  const root = document.documentElement;
  const storefront = document.querySelector<HTMLElement>('[data-storefront-root]');
  if (!storefront || root.dataset.storefront !== 'show') return;

  // Keep keyboard and screen-reader focus on the storefront while it covers the page.
  // That includes the "Skip to content" link: the storefront has its own Skip button.
  const behind = Array.from(document.body.children).filter((element) => element !== storefront);
  behind.forEach((element) => element.setAttribute('inert', ''));

  const controller = new AbortController();
  const { signal } = controller;
  let opening = false;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    controller.abort();
    behind.forEach((element) => element.removeAttribute('inert'));
    delete root.dataset.storefront;
    storefront.classList.remove('is-opening');
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  const open = () => {
    if (opening) return;
    opening = true;
    remember();
    storefront.classList.add('is-opening');
    window.setTimeout(finish, GIVE_UP_MS);
  };

  const skip = () => {
    remember();
    finish();
  };

  storefront.querySelector('[data-storefront-door]')?.addEventListener('click', open, { signal });
  storefront.querySelector('[data-storefront-skip]')?.addEventListener('click', skip, { signal });

  // The last step of the way in is the storefront fading out. When that ends, we are done.
  storefront.addEventListener(
    'animationend',
    (event) => {
      if (event.target === storefront && event.animationName === 'storefront-fade') finish();
    },
    { signal },
  );

  // A click anywhere while the animation plays skips the rest of it.
  storefront.addEventListener(
    'click',
    (event) => {
      if (opening && event.target instanceof Element && !event.target.closest('[data-storefront-door]')) skip();
    },
    { signal },
  );

  // Scrolling (wheel, touch drag or the usual scroll keys) also opens the door.
  window.addEventListener('wheel', open, { signal, passive: true });
  window.addEventListener('touchmove', open, { signal, passive: true });
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') skip();
      else if (['ArrowDown', 'PageDown', 'End'].includes(event.key)) open();
      else if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) open();
    },
    { signal },
  );

  storefront.querySelector<HTMLElement>('[data-storefront-door]')?.focus({ preventScroll: true });
}

document.addEventListener('astro:page-load', setup);

export {};
