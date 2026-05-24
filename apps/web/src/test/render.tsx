import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../app/providers";

export function renderWithProviders(ui: ReactElement, initialEntries = ["/"]) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AppProviders>
  );
}
