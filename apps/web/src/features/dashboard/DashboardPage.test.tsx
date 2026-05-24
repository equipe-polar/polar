import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renderiza dados resumidos", async () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Ultimas ocorrencias")).toBeInTheDocument();
    expect(screen.getByText("Alta prioridade")).toBeInTheDocument();
    expect(await screen.findByText("Maria Eduarda")).toBeInTheDocument();
  });
});
