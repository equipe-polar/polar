import { Navigate, RouteObject, useRoutes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AlunosPage } from "../features/alunos/AlunosPage";
import { PerfilAlunoPage } from "../features/alunos/PerfilAlunoPage";
import { AccessDeniedPage } from "../features/auth/AccessDeniedPage";
import { LoginPage } from "../features/auth/LoginPage";
import { ConfiguracoesPage } from "../features/configuracoes/ConfiguracoesPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DetalheOcorrenciaPage } from "../features/ocorrencias/DetalheOcorrenciaPage";
import { NovaOcorrenciaPage } from "../features/ocorrencias/NovaOcorrenciaPage";
import { OcorrenciasListPage } from "../features/ocorrencias/OcorrenciasListPage";
import { RelatoriosPage } from "../features/relatorios/RelatoriosPage";
import { TurmasPage } from "../features/turmas/TurmasPage";
import { UsuariosPage } from "../features/usuarios/UsuariosPage";
import { NotFoundPage } from "./NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";

const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            element: <ProtectedRoute permission="ocorrencias:view" />,
            children: [
              { path: "ocorrencias", element: <OcorrenciasListPage /> },
              { path: "ocorrencias/:id", element: <DetalheOcorrenciaPage /> }
            ]
          },
          {
            element: <ProtectedRoute permission="ocorrencias:create" />,
            children: [{ path: "ocorrencias/nova", element: <NovaOcorrenciaPage /> }]
          },
          {
            element: <ProtectedRoute permission="alunos:view" />,
            children: [
              { path: "alunos", element: <AlunosPage /> },
              { path: "alunos/:id", element: <PerfilAlunoPage /> }
            ]
          },
          {
            element: <ProtectedRoute permission="turmas:view" />,
            children: [{ path: "turmas", element: <TurmasPage /> }]
          },
          {
            element: <ProtectedRoute permission="usuarios:manage" />,
            children: [{ path: "usuarios", element: <UsuariosPage /> }]
          },
          {
            element: <ProtectedRoute permission="relatorios:view" />,
            children: [{ path: "relatorios", element: <RelatoriosPage /> }]
          },
          {
            element: <ProtectedRoute permission="configuracoes:manage" />,
            children: [{ path: "configuracoes", element: <ConfiguracoesPage /> }]
          },
          { path: "acesso-negado", element: <AccessDeniedPage /> },
          { path: "404", element: <NotFoundPage /> },
          { path: "*", element: <Navigate to="/404" replace /> }
        ]
      }
    ]
  }
];

export function AppRoutes() {
  return useRoutes(routes);
}
