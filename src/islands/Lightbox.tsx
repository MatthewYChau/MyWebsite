import { useCallback, useEffect, useRef, useState } from 'react';
import './lightbox.css';

export interface LightboxPhoto {
  src: string;
  width: number;
  height: number;
  caption: string;
  location: string;
  date: string;
}

interface Props {
  photos: LightboxPhoto[];
}

/**
 * Opens when a photo link with data-lightbox-index is clicked.
 * Left and right arrow keys move between photos. Escape closes.
 */
export default function Lightbox({ photos }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus();
  }, []);

  const step = useCallback(
    (amount: number) => {
      setIndex((current) => (current === null ? current : (current + amount + photos.length) % photos.length));
    },
    [photos.length],
  );

  // Listen for clicks on the photo links (capture phase, so this runs before page navigation).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLElement>('[data-lightbox-index]');
      if (!link) return;
      const next = Number(link.dataset.lightboxIndex);
      if (!Number.isInteger(next) || !photos[next]) return;
      event.preventDefault();
      triggerRef.current = link;
      setIndex(next);
    };
    const reset = () => setIndex(null);
    document.addEventListener('click', onClick, true);
    document.addEventListener('astro:before-preparation', reset);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('astro:before-preparation', reset);
    };
  }, [photos]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  const photo = index === null ? null : photos[index];

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label="Photo viewer"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') step(1);
        if (event.key === 'ArrowLeft') step(-1);
      }}
    >
      {photo && index !== null && (
        <div className="lightbox__inner">
          <figure className="lightbox__figure">
            <img
              key={photo.src}
              className="lightbox__image"
              src={photo.src}
              width={photo.width}
              height={photo.height}
              alt={photo.caption}
            />
            <figcaption className="lightbox__caption">
              <span className="lightbox__text">{photo.caption}</span>
              <span className="lightbox__meta">
                {photo.location} · {photo.date}
              </span>
              <span className="lightbox__count" aria-live="polite">
                Photo {index + 1} of {photos.length}
              </span>
            </figcaption>
          </figure>

          <div className="lightbox__controls">
            <button type="button" className="lightbox__button" onClick={() => step(-1)} aria-label="Previous photo">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className="lightbox__button lightbox__button--close" onClick={close} autoFocus>
              Close
            </button>
            <button type="button" className="lightbox__button" onClick={() => step(1)} aria-label="Next photo">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
