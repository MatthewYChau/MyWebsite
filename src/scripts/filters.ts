/**
 * Menu filters.
 * - "Made at" chips: show only items made at the chosen places (none chosen = all)
 * - 走冰 (no-progress): hide items that are still in progress
 * - 少甜 (no-placeholder): hide placeholder items, including placeholder books, videos and photos
 * Choices are remembered for the browser tab.
 */
const STORAGE_KEY = 'cct-filters';

interface FilterState {
  made: string[];
  flags: string[];
}

function load(): FilterState {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<FilterState>;
    return {
      made: Array.isArray(parsed.made) ? parsed.made : [],
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch {
    return { made: [], flags: [] };
  }
}

let state = load();

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked. Filters still work for this page.
  }
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function apply() {
  const root = document.querySelector<HTMLElement>('[data-filters]');
  if (!root) return;

  root.querySelectorAll<HTMLButtonElement>('[data-filter-made]').forEach((button) => {
    button.setAttribute('aria-pressed', String(state.made.includes(button.dataset.filterMade ?? '')));
  });
  root.querySelectorAll<HTMLButtonElement>('[data-filter-flag]').forEach((button) => {
    button.setAttribute('aria-pressed', String(state.flags.includes(button.dataset.filterFlag ?? '')));
  });

  const hideInProgress = state.flags.includes('no-progress');
  const hidePlaceholders = state.flags.includes('no-placeholder');

  let total = 0;
  let shown = 0;

  document.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    const visible =
      (state.made.length === 0 || state.made.includes(card.dataset.madeAt ?? '')) &&
      !(hideInProgress && card.dataset.status === 'in-progress') &&
      !(hidePlaceholders && card.dataset.placeholder === 'true');
    card.hidden = !visible;

    // Count each dish once: Today's Sets repeats dishes from the sections below.
    if (card.closest('[data-menu-section]')) {
      total += 1;
      if (visible) shown += 1;
    }
  });

  // Placeholder books, videos, photos and links.
  document.querySelectorAll<HTMLElement>('[data-placeholder-item]').forEach((item) => {
    item.hidden = hidePlaceholders;
  });

  // "Nothing here" notes for groups the filters emptied.
  document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((group) => {
    const anyVisible = group.querySelector('[data-card]:not([hidden]), [data-placeholder-item]:not([hidden]), [data-real-item]');
    group.querySelector<HTMLElement>('[data-empty]')?.toggleAttribute('hidden', Boolean(anyVisible));
  });

  const active = state.made.length > 0 || state.flags.length > 0;
  const status = root.querySelector<HTMLElement>('[data-filter-status]');
  if (status) status.textContent = active ? `Showing ${shown} of ${total} items.` : '';
  root.querySelector<HTMLElement>('[data-filter-clear]')?.toggleAttribute('hidden', !active);
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('[data-filter-made], [data-filter-flag], [data-filter-clear]');
  if (!button) return;

  if (button.dataset.filterMade) {
    state = { ...state, made: toggle(state.made, button.dataset.filterMade) };
  } else if (button.dataset.filterFlag) {
    state = { ...state, flags: toggle(state.flags, button.dataset.filterFlag) };
  } else {
    state = { made: [], flags: [] };
  }

  save();
  apply();
});

document.addEventListener('astro:page-load', apply);
apply();

export {};
