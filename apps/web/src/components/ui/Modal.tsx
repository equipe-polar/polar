import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import "./ui.css";

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop" role="presentation">
      <section className="ui-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="ui-modal__header">
          <h2>{title}</h2>
          <Button variant="ghost" icon={<X size={18} />} onClick={onClose} aria-label="Fechar">
            Fechar
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
