import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProviders } from "./providers";
import { ProtectedRoute } from "./ProtectedRoute";

describe("ProtectedRoute", () => {
  it("bloqueia usuario sem permissao", () => {
    localStorage.setItem(
      "polar_user",
      JSON.stringify({ id: "u1", nome: "Professor", email: "prof@polar.local", papel: "PROFESSOR" })
    );

    renderWithRoute();

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });
});

function renderWithRoute() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/usuarios"]}>
        <Routes>
          <Route element={<ProtectedRoute permission="usuarios:manage" />}>
            <Route path="/usuarios" element={<p>Usuarios</p>} />
          </Route>
          <Route path="/acesso-negado" element={<p>Acesso negado</p>} />
          <Route path="/login" element={<p>Login</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}
