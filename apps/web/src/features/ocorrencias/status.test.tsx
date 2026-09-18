import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrioridadeBadge } from "./status";

describe("PrioridadeBadge", () => {
  it.each([
    ["BAIXA", "Baixa: Baixa gravidade", "ui-badge--success"],
    ["MEDIA", "Media: Gravidade moderada", "ui-badge--warning"],
    ["ALTA", "Alta: Grave", "ui-badge--danger"],
    ["URGENTE", "Urgente: Urgencia", "ui-badge--critical"]
  ] as const)("exibe %s com texto e marcador, sem depender apenas de cor", (prioridade, texto, classe) => {
    render(<PrioridadeBadge prioridade={prioridade} />);

    const badge = screen.getByText(texto);
    expect(badge).toHaveClass(classe);
    expect(badge.querySelector(".severity-badge__marker")).toBeInTheDocument();
  });
});
