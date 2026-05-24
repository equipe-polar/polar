import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { OcorrenciasListPage } from "./OcorrenciasListPage";

describe("OcorrenciasListPage", () => {
  it("renderiza tabela com ocorrencias", async () => {
    renderWithProviders(<OcorrenciasListPage />, ["/ocorrencias"]);

    expect(await screen.findByText("Maria Eduarda")).toBeInTheDocument();
    expect(screen.getByText("Lucas Pereira")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
