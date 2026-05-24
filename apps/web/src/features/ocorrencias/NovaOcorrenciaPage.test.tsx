import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { NovaOcorrenciaPage } from "./NovaOcorrenciaPage";

describe("NovaOcorrenciaPage", () => {
  it("valida campos obrigatorios", async () => {
    renderWithProviders(<NovaOcorrenciaPage />, ["/ocorrencias/nova"]);

    await userEvent.click(screen.getByRole("button", { name: /registrar/i }));

    expect(await screen.findByText("Selecione um aluno.")).toBeInTheDocument();
    expect(screen.getByText("Informe a categoria.")).toBeInTheDocument();
    expect(screen.getByText("Descreva a ocorrencia com pelo menos 10 caracteres.")).toBeInTheDocument();
  });
});
