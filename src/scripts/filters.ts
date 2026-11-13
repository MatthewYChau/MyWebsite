/**
 * Menu filters.
 * - "Made at" chips: one at a time. "All" (or pressing the chosen chip again) shows everything.
 * - 走冰 / No ice (no-progress): hide items that are still in progress
 * - 少甜 / Less sweet (no-placeholder): hide placeholder items, including placeholder books, videos and photos
 * Choices are remembered for the browser tab.
 */
const STORAGE_KEY = 'cct-filters';

interface FilterState {
  /** The one chosen "Made at" place, or null for all. */
  made: string | null;
  flags: string[];
}

function load(): FilterState {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as { made?: unknown; flags?: unknown };
    return {
      made: typeof parsed.made === 'string' && parsed.made ? parsed.made : null,
      flags: Array.isArray(parsed.flags) ? parsed.flags.filter((flag): flag is string => typeof flag === 'string') : [],
    };
  } catch {
    return { made: null, flags: [] };
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

  // The "All" chip has an empty value.
  root.querySelectorAll<HTMLButtonElement>('[data-filter-made]').forEach((button) => {
    const value = button.dataset.filterMade ?? '';
    button.setAttribute('aria-pressed', String(value === '' ? state.made === null : state.made === value));
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
      (state.made === null || state.made === card.dataset.madeAt) &&
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

  const active = state.made !== null || state.flags.length > 0;
  const status = root.querySelector<HTMLElement>('[data-filter-status]');
  if (status) status.textContent = active ? `Showing ${shown} of ${total} items.` : '';
  root.querySelector<HTMLElement>('[data-filter-clear]')?.toggleAttribute('hidden', !active);
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('[data-filter-made], [data-filter-flag], [data-filter-clear]');
  if (!button) return;

  const made = button.getAttribute('data-filter-made');
  if (made !== null) {
    // One place at a time. "All", or the chosen place pressed again, clears it.
    state = { ...state, made: made === '' || made === state.made ? null : made };
  } else if (button.dataset.filterFlag) {
    state = { ...state, flags: toggle(state.flags, button.dataset.filterFlag) };
  } else {
    state = { made: null, flags: [] };
  }

  save();
  apply();
});

document.addEventListener('astro:page-load', apply);
apply();

export {};
