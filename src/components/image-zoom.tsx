'use client';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useStore } from './providers';
export function ImageZoom({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { tx } = useStore();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="zoom-overlay"
      aria-label={tx('Фото товара')}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button aria-label={tx('Закрыть')} autoFocus onClick={onClose}>
        <X />
      </button>
      <Image src={src} alt={alt} fill sizes="100vw" style={{ objectFit: 'contain' }} />
    </dialog>
  );
}
