# P.O.L.A.R. - API REST

API REST em Node.js/Express para integrar o frontend HTML/CSS/JS, o backend Python e um endpoint externo de ocorrencias. A arquitetura principal do projeto foi preservada: a API nova fica em `api/src/`, o backend Python permanece em `backend/` e o frontend continua em `frontend/`.

## Estrutura entregue

```text
api/
  server.js
  src/
    app.js
    controllers/
    middlewares/
    model/
    routes/
    util/
backend/
  services/
    polar_api_service.py
frontend/
  js/
    app.js
```

## Instalacao

```bash
cd api
npm install
```

Requisitos locais:

- Node.js 18 ou superior.
- Python instalado. No Windows, a API tenta ignorar atalhos do WindowsApps e usar o `python.exe` real.
- Banco JSON padrao em `backend/banco_dados.json`.

## Configuracao

Arquivo: `api/.env`

```env
PORT=3000
PYTHON_PATH=py
CORS_ORIGIN=*
JWT_SECRET=altere-este-segredo-em-producao
JWT_EXPIRES_IN=8h
EXTERNAL_API_URL=https://exemplo.com/api/occurrences
EXTERNAL_API_TIMEOUT=5000
```

Em producao, troque `JWT_SECRET`, restrinja `CORS_ORIGIN` e configure `EXTERNAL_API_URL` com o endpoint real.

## Execucao

```bash
cd api
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

Resposta:

```json
{
  "status": "ok",
  "uptime": 12.3,
  "timestamp": "2026-05-15T18:30:00.000Z"
}
```

## Autenticacao

Login inicial:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Resposta:

```json
{
  "message": "Login realizado com sucesso",
  "token": "jwt...",
  "user": {
    "id": "id",
    "username": "admin",
    "role": "ADM"
  }
}
```

Use o token nas rotas protegidas:

```http
Authorization: Bearer jwt...
```

## Endpoints

Alunos:

- `GET /students`
- `GET /students/:id`
- `POST /students`
- `PUT /students/:id`
- `DELETE /students/:id`

Ocorrencias:

- `GET /occurrences`
- `GET /occurrences/:id`
- `POST /occurrences`
- `PUT /occurrences/:id`
- `DELETE /occurrences/:id`

Usuarios:

- `GET /users`
- `POST /users`
- `POST /auth/login`

Relatorios:

- `GET /reports/occurrences`
- `GET /reports/student/:id`

Notificacoes:

- `POST /notifications`

## Exemplos

Criar aluno:

```http
POST /students
Authorization: Bearer jwt...
Content-Type: application/json

{
  "name": "Joao da Silva",
  "class": "8A",
  "registration": "2024001",
  "responsibleName": "Maria Silva",
  "responsibleContact": "(11) 99999-0000"
}
```

Criar ocorrencia:

```http
POST /occurrences
Authorization: Bearer jwt...
Content-Type: application/json

{
  "studentId": "id-do-aluno",
  "type": "Atraso",
  "description": "Aluno chegou atrasado e foi orientado pela coordenacao.",
  "severity": "baixa"
}
```

Resposta com integracao externa concluida:

```json
{
  "message": "Ocorrencia criada com sucesso",
  "data": {
    "id": "id",
    "studentId": "id-do-aluno",
    "type": "Atraso",
    "status": "REGISTRADA"
  },
  "externalIntegration": {
    "success": true,
    "status": 200
  }
}
```

Se o endpoint externo falhar, a ocorrencia local continua salva e a API responde com status `207`:

```json
{
  "message": "Ocorrencia criada com sucesso, mas a integracao externa falhou",
  "data": {},
  "externalIntegration": {
    "success": false,
    "status": null,
    "message": "timeout"
  }
}
```

## Integracao Node -> Python

A API Express chama `backend/services/polar_api_service.py` por `child_process`. O utilitario fica em:

```text
api/src/util/pythonBridge.js
```

Fluxo:

1. Controller valida e sanitiza a entrada.
2. `pythonBridge` executa o servico Python com comando e payload JSON.
3. O Python le/grava `backend/banco_dados.json`.
4. A resposta volta em JSON para o controller Express.

Exemplo interno:

```js
await callBackend("students.create", {
  auth: { username: "admin", role: "ADM" },
  student: { name: "Ana", class: "8A" }
});
```

## Integracao frontend -> API

O arquivo `frontend/js/app.js` expoe `window.POLAR_API` com funcoes prontas:

- `POLAR_API.login(username, password, remember)`
- `POLAR_API.listOccurrences()`
- `POLAR_API.createOccurrence(data)`
- `POLAR_API.listStudents()`
- `POLAR_API.createStudent(data)`
- `POLAR_API.occurrenceReport()`
- `POLAR_API.studentReport(id)`
- `POLAR_API.sendNotification(data)`

As telas `dashboard.html`, `ocorrencias-lista.html`, `ocorrencia-nova.html`, `alunos.html`, `aluno-historico.html` e `usuarios.html` tentam carregar dados reais quando existe token JWT salvo.

## Seguranca

- JWT nas rotas protegidas.
- Hash de senha no backend Python via PBKDF2.
- Sanitizacao basica de strings.
- Validacao de campos obrigatorios nos models/controllers.
- CORS configuravel por ambiente.
- Tratamento global de erro.
- Logs por requisicao.

## Qualidade

Verificacao sintatica:

```bash
cd api
npm run check
```

Smoke test recomendado:

1. Inicie a API com `npm start`.
2. Faca login em `POST /auth/login`.
3. Use o JWT para criar um aluno em `POST /students`.
4. Crie uma ocorrencia em `POST /occurrences`.
5. Consulte `GET /reports/occurrences`.
