import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 m-0 max-h-[85vh] w-[min(90vw,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-border bg-card p-0 shadow-lg backdrop:bg-black/60"
      onClose={onClose}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            type="button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
