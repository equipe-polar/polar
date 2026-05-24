import type { ReactNode } from "react";
import { Breadcrumb } from "../ui/Breadcrumb";
import "./layout.css";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; to?: string }>;
}) {
  return (
    <div className="page-header">
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
      <div className="page-header__row">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
