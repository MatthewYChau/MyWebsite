/**
 * Tailors the résumé page to an order.
 * The projects to show come from the address (?items=first-id,second-id),
 * or else from the order ticked in this browser tab.
 * With neither, every project shows.
 */
import { getOrder } from './order-store';

function apply() {
  const root = document.querySelector<HTMLElement>('[data-resume]');
  if (!root) return;

  const rows = [...root.querySelectorAll<HTMLElement>('[data-resume-project]')];
  const known = new Set(rows.map((row) => row.dataset.resumeProject ?? ''));

  const fromAddress = (new URLSearchParams(window.location.search).get('items') ?? '').split(',');
  const source = fromAddress.some((id) => known.has(id)) ? fromAddress : getOrder();
  const wanted = source.filter((id) => known.has(id));
  const tailored = wanted.length > 0;

  rows.forEach((row) => {
    row.hidden = tailored && !wanted.includes(row.dataset.resumeProject ?? '');
  });

  const status = document.querySelector<HTMLElement>('[data-resume-status]');
  if (status) {
    status.textContent = tailored
      ? `Showing the ${wanted.length} ${wanted.length === 1 ? 'project' : 'projects'} from your order.`
      : 'Showing every project. Tick projects on the menu and check out to tailor it.';
  }
}

document.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('[data-resume-print]')) window.print();
});

document.addEventListener('astro:page-load', apply);
apply();

export {};
