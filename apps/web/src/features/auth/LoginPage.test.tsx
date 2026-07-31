import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/render";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("renderiza o formulario de acesso", () => {
    renderWithProviders(<LoginPage />, ["/login"]);

    expect(screen.getByRole("heading", { name: "Ola, novamente!" })).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario ou e-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acessar/i })).toBeInTheDocument();
  });

  it("apresenta o painel institucional ao lado do formulario", () => {
    renderWithProviders(<LoginPage />, ["/login"]);

    expect(screen.getByRole("heading", { name: /voce sabe o que e o/i })).toBeInTheDocument();
    expect(screen.getByText(/historico imutavel/i)).toBeInTheDocument();
  });
});
