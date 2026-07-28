# POLAR - imagem de producao: 1 servico (API Express servindo o build do React).
#
# Estagio unico e deliberado: o monorepo pnpm usa symlinks e store compartilhado,
# e copiar node_modules entre estagios e a principal fonte de builds quebrados.
# A imagem fica maior (~600 MB), o que e irrelevante no plano gratuito do Render,
# e em troca o build e reproduzivel e facil de depurar por qualquer membro da equipe.
FROM node:20-slim

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# .dockerignore ja remove node_modules, dist, .env e docs.
COPY . .

# --prod=false garante devDependencies (typescript, vite, tsc) mesmo que o
# ambiente de build defina NODE_ENV=production.
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm build

# NODE_ENV so depois do build: em producao a API exige MySQL e passa a servir
# o SPA de apps/web/dist.
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
