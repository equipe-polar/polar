create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  papel text not null check (papel in ('PROFESSOR', 'COORDENADOR', 'DIRETOR', 'ADM')),
  senha_hash text not null,
  ativo boolean not null default true,
  precisa_trocar_senha boolean not null default true,
  tentativas_login_invalidas integer not null default 0,
  bloqueado_ate timestamptz,
  ultimo_login_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ano_letivo integer not null,
  turno text not null,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text not null unique,
  turma_id uuid not null references turmas(id),
  responsavel_nome text not null default '',
  responsavel_contato text not null default '',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists categorias_ocorrencia (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true
);

create table if not exists ocorrencias (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id),
  categoria text not null,
  prioridade text not null check (prioridade in ('BAIXA', 'MEDIA', 'ALTA')),
  descricao text not null,
  local text not null default '',
  testemunhas text not null default '',
  status text not null check (status in ('REGISTRADA', 'EM_ANALISE', 'RESOLVIDA', 'ENCERRADA')),
  criado_por_id uuid not null references users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists ocorrencia_historico (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null references ocorrencias(id),
  status text not null check (status in ('REGISTRADA', 'EM_ANALISE', 'RESOLVIDA', 'ENCERRADA')),
  acao text not null,
  usuario_id uuid not null references users(id),
  criado_em timestamptz not null default now()
);

create table if not exists notas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id),
  disciplina text not null,
  valor numeric(4,2) not null check (valor >= 0 and valor <= 10),
  etapa text not null,
  professor_id uuid not null references users(id),
  data date not null,
  criado_em timestamptz not null default now()
);

create table if not exists faltas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos(id),
  data date not null,
  justificativa text,
  registrada_por_id uuid not null references users(id),
  criado_em timestamptz not null default now(),
  unique (aluno_id, data)
);

create table if not exists user_permissions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references users(id),
  permissao text not null,
  unique (usuario_id, permissao)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references users(id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensagem text not null,
  destinatario_id uuid references users(id),
  ocorrencia_id uuid references ocorrencias(id),
  lida boolean not null default false,
  criado_por_id uuid not null references users(id),
  criado_em timestamptz not null default now()
);

create index if not exists idx_ocorrencias_status on ocorrencias(status);
create index if not exists idx_ocorrencias_aluno_id on ocorrencias(aluno_id);
create index if not exists idx_ocorrencia_historico_ocorrencia_id on ocorrencia_historico(ocorrencia_id);
create index if not exists idx_audit_logs_entidade on audit_logs(entidade, entidade_id);
