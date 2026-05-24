import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <div className="app-root">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AppProviders>
  );
}
