/**
 * Keeps every "Add to order" tick box on the page in step with the order.
 * One listener on the document covers all cards, on every page.
 */
import { hasItem, setItem, subscribe } from './order-store';

function sync() {
  document.querySelectorAll<HTMLInputElement>('input[data-order-id]').forEach((input) => {
    input.checked = hasItem(input.dataset.orderId ?? '');
  });
}

document.addEventListener('change', (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.dataset.orderId) {
    setItem(input.dataset.orderId, input.checked);
  }
});

subscribe(sync);
document.addEventListener('astro:page-load', sync);
sync();
