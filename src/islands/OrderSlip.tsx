import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { clearOrder, getOrder, setItem, subscribe } from '../scripts/order-store';
import './order-slip.css';

export interface SlipItem {
  id: string;
  code: string;
  name: string;
  section: string;
  href: string;
}

export interface SlipSection {
  key: string;
  zh: string;
  en: string;
}

interface Props {
  items: SlipItem[];
  sections: SlipSection[];
}

interface Receipt {
  table: number;
  time: string;
  items: SlipItem[];
}

const EMPTY: string[] = [];
const getServerOrder = () => EMPTY;

/** A pencil tick. It draws itself when the box next to it is checked. */
export function Tick() {
  return (
    <svg className="tickbox__tick" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 13 C6 14.5 8 17 9.5 20 C12 13 16 7 23 1" pathLength={1} />
    </svg>
  );
}

function Drone() {
  return (
    <svg className="drone__body" viewBox="0 0 120 56" aria-hidden="true" focusable="false">
      <g className="drone__rotor drone__rotor--left">
        <ellipse cx="22" cy="10" rx="20" ry="3" />
      </g>
      <g className="drone__rotor drone__rotor--right">
        <ellipse cx="98" cy="10" rx="20" ry="3" />
      </g>
      <path className="drone__frame" d="M22 12v8h76v-8" />
      <rect className="drone__hull" x="40" y="16" width="40" height="18" rx="8" />
      <circle className="drone__eye" cx="60" cy="25" r="4" />
      <path className="drone__frame" d="M46 34l-6 12M74 34l6 12M34 46h14M72 46h14" />
    </svg>
  );
}

export default function OrderSlip({ items, sections }: Props) {
  const order = useSyncExternalStore(subscribe, getOrder, getServerOrder);
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [flying, setFlying] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelId = useId();
  const receiptTitleId = useId();

  const ordered = items.filter((item) => order.includes(item.id));
  const count = ordered.length;

  // Open and close the receipt with the browser's own modal dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (receipt && !dialog.open) dialog.showModal();
    if (!receipt && dialog.open) dialog.close();
  }, [receipt]);

  // The slip stays alive across page changes, so tidy it up when a new page loads.
  useEffect(() => {
    const tidy = () => {
      setReceipt(null);
      setFlying(false);
      setOpen(false);
    };
    document.addEventListener('astro:before-preparation', tidy);
    return () => document.removeEventListener('astro:before-preparation', tidy);
  }, []);

  function checkout() {
    if (!count) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReceipt({
      table: 1 + Math.floor(Math.random() * 88),
      time: new Date().toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }),
      items: ordered,
    });
    setFlying(!reducedMotion);
    setOpen(false);
  }

  function newOrder() {
    clearOrder();
    setReceipt(null);
  }

  return (
    <div className={`slip${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="slip__tab"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="slip__tab-label">
          <span lang="zh-Hant">點餐紙</span> Order slip
        </span>
        <span className="slip__count" aria-label={`${count} ticked`}>
          {count}
        </span>
        <svg className="slip__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <section className="slip__paper" id={panelId} aria-label="Order slip">
        <header className="slip__head">
          <p className="slip__title">
            <span lang="zh-Hant">點餐紙</span>
            <span>Order slip</span>
          </p>
          <p className="slip__hint">Tick what you would like to see, then check out.</p>
        </header>

        {sections.map((section) => (
          <fieldset className="slip__group" key={section.key}>
            <legend>
              <span lang="zh-Hant">{section.zh}</span> {section.en}
            </legend>
            <ul>
              {items
                .filter((item) => item.section === section.key)
                .map((item) => (
                  <li key={item.id}>
                    <label className="slip__row">
                      <input
                        type="checkbox"
                        className="visually-hidden"
                        checked={order.includes(item.id)}
                        onChange={(event) => setItem(item.id, event.target.checked)}
                      />
                      <span className="tickbox" aria-hidden="true">
                        <Tick />
                      </span>
                      <span className="slip__code">{item.code}</span>
                      <span className="slip__name">{item.name}</span>
                    </label>
                  </li>
                ))}
            </ul>
          </fieldset>
        ))}

        <footer className="slip__foot">
          <p className="slip__total" aria-live="polite">
            {count} {count === 1 ? 'item' : 'items'} ticked
          </p>
          <div className="slip__actions">
            <button type="button" className="slip__clear" disabled={!count} onClick={clearOrder}>
              Clear
            </button>
            <button type="button" className="btn slip__checkout" disabled={!count} onClick={checkout}>
              <span lang="zh-Hant">埋單</span> Check out
            </button>
          </div>
        </footer>
      </section>

      <dialog
        ref={dialogRef}
        className="receipt"
        aria-labelledby={receiptTitleId}
        onClose={() => setReceipt(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setReceipt(null);
        }}
      >
        {receipt && (
          <>
            <div className="receipt__paper">
              <p className="receipt__shop" id={receiptTitleId}>
                Matthew Chau <span lang="zh-Hant">茶餐廳</span>
              </p>
              <p className="receipt__meta">
                <span>
                  <span lang="zh-Hant">檯號</span> Table {receipt.table}
                </span>
                <span>{receipt.time}</span>
              </p>
              <ol className="receipt__items">
                {receipt.items.map((item) => (
                  <li key={item.id}>
                    <a href={item.href}>
                      <span className="receipt__code">{item.code}</span>
                      <span className="receipt__name">{item.name}</span>
                      <span className="receipt__qty" aria-hidden="true">
                        ×1
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
              <p className="receipt__total">
                <span>Items</span>
                <span>{receipt.items.length}</span>
              </p>
              <p className="receipt__note">Pick an item above to have it served.</p>
              <p className="receipt__thanks">
                <span lang="zh-Hant">多謝惠顧</span> Thank you
              </p>
              <div className="receipt__actions">
                <button type="button" className="btn btn--quiet" onClick={newOrder}>
                  New order
                </button>
                <button type="button" className="btn" onClick={() => setReceipt(null)}>
                  Close
                </button>
              </div>
            </div>

            {flying && (
              <div className="drone-run" aria-hidden="true">
                <div
                  className="drone"
                  onAnimationEnd={(event) => {
                    if (event.animationName === 'drone-fly') setFlying(false);
                  }}
                >
                  <Drone />
                </div>
                <div className="drone__bag" />
              </div>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
