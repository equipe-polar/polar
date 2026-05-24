import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("renderiza tela de login", () => {
    renderWithProviders(<LoginPage />, ["/login"]);

    expect(screen.getByText("P.O.L.A")).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario ou e-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acessar/i })).toBeInTheDocument();
  });
});
