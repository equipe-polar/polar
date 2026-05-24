import type { ReactNode } from "react";
import "./ui.css";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, active, onChange }: { items: TabItem[]; active: string; onChange: (id: string) => void }) {
  const current = items.find((item) => item.id === active) ?? items[0];
  return (
    <div className="ui-tabs">
      <div className="ui-tabs__list" role="tablist">
        {items.map((item) => (
          <button key={item.id} className={item.id === current.id ? "is-active" : ""} role="tab" onClick={() => onChange(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="ui-tabs__panel" role="tabpanel">
        {current.content}
      </div>
    </div>
  );
}
