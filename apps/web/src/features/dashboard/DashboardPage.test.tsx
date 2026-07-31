import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renderiza saudacao, indicadores e ultimas ocorrencias", async () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole("heading", { name: /^ola,/i })).toBeInTheDocument();
    expect(screen.getByText("Alta prioridade")).toBeInTheDocument();
    expect(screen.getByText("Em analise")).toBeInTheDocument();
    expect(screen.getByText("Ultimas ocorrencias")).toBeInTheDocument();
    expect(await screen.findByText("Maria Eduarda")).toBeInTheDocument();
  });

  it("mostra ha quanto tempo cada ocorrencia esta aberta", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByText("Maria Eduarda");
    expect(screen.getByText("Em aberto")).toBeInTheDocument();
  });
});
