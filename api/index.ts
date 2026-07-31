// Entrypoint serverless da Vercel.
//
// A Vercel nao roda um processo que fica escutando: ela invoca um handler por
// requisicao. `createApp()` ja e livre de listener (quem chama `listen` e o
// apps/api/src/server.ts, usado no Docker e no desenvolvimento local), entao aqui
// basta criar a app uma vez e reaproveita-la enquanto a instancia estiver quente.
//
// O import aponta para o build (apps/api/dist), e nao para o fonte: o buildCommand
// do vercel.json roda `pnpm build` antes de empacotar as funcoes, e assim o codigo
// da funcao e exatamente o mesmo artefato que o Docker executa.
//
// O SPA nao passa por aqui: a Vercel serve apps/web/dist direto do CDN e so
// encaminha /api/* para esta funcao (ver vercel.json).

import type { IncomingMessage, ServerResponse } from "node:http";

import { createApp } from "../apps/api/dist/app.js";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// Uma unica promise por instancia: invocacoes concorrentes no mesmo container
// compartilham a mesma app (e o mesmo pool de conexoes) em vez de criar uma nova.
let appPromise: Promise<Handler> | null = null;

function getApp(): Promise<Handler> {
  if (!appPromise) {
    appPromise = createApp() as Promise<Handler>;
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app(req, res);
}
