import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiasEmAberto, diasDesde } from "./DiasEmAberto";

function isoHaDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString();
}

describe("diasDesde", () => {
  it("conta dias inteiros desde a abertura", () => {
    expect(diasDesde(isoHaDias(0))).toBe(0);
    expect(diasDesde(isoHaDias(5))).toBe(5);
  });

  // Relogio de cliente atrasado nao pode virar contagem negativa na tela.
  it("nunca devolve negativo para data futura", () => {
    expect(diasDesde(isoHaDias(-3))).toBe(0);
  });

  it("devolve zero para data invalida", () => {
    expect(diasDesde("nao-e-data")).toBe(0);
  });
});

describe("DiasEmAberto", () => {
  it("nao envelhece ocorrencia encerrada", () => {
    render(<DiasEmAberto desde={isoHaDias(40)} status="ENCERRADA" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("escala a severidade conforme o tempo em aberto", () => {
    const { container: recente } = render(<DiasEmAberto desde={isoHaDias(1)} status="REGISTRADA" />);
    expect(recente.querySelector(".aging--normal")).not.toBeNull();

    const { container: atencao } = render(<DiasEmAberto desde={isoHaDias(5)} status="REGISTRADA" />);
    expect(atencao.querySelector(".aging--alerta")).not.toBeNull();

    const { container: critico } = render(<DiasEmAberto desde={isoHaDias(12)} status="EM_ANALISE" />);
    expect(critico.querySelector(".aging--critico")).not.toBeNull();
  });

  it("usa texto legivel para hoje e para um dia", () => {
    render(<DiasEmAberto desde={isoHaDias(0)} status="REGISTRADA" />);
    expect(screen.getByText("hoje")).toBeInTheDocument();

    render(<DiasEmAberto desde={isoHaDias(1)} status="REGISTRADA" />);
    expect(screen.getByText("1 dia")).toBeInTheDocument();
  });
});
