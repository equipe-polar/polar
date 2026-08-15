-- POLAR - Schema relacional oficial (PostgreSQL 15+ / Supabase)
-- Encoding UTF8: obrigatorio para acentuacao PT-BR ("Não fez atividade", "Dano ao patrimônio").
-- No Supabase o banco ja nasce em UTF8; nao ha nada a configurar.
-- IDs: CHAR(36) UUID gerados pela aplicacao (novoId()). Nao usamos o tipo UUID nativo
-- porque o dominio trafega id como string em todas as camadas.
-- Datas: TIMESTAMPTZ(3) em UTC, geradas pela aplicacao (backend e a autoridade de data).

-- Tipos enumerados. DO $$ ... $$ porque o Postgres nao tem CREATE TYPE IF NOT EXISTS.
DO $$ BEGIN
  CREATE TYPE papel_usuario AS ENUM ('PROFESSOR', 'COORDENADOR', 'DIRETOR', 'ADM', 'ALUNO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prioridade_ocorrencia AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_ocorrencia AS ENUM ('REGISTRADA', 'EM_ANALISE', 'RESOLVIDA', 'ENCERRADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  papel papel_usuario NOT NULL,
  senha_hash VARCHAR(100) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  precisa_trocar_senha BOOLEAN NOT NULL DEFAULT TRUE,
  tentativas_login_invalidas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ(3) NULL,
  ultimo_login_em TIMESTAMPTZ(3) NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  atualizado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS turmas (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  ano_letivo INTEGER NOT NULL,
  turno VARCHAR(40) NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  atualizado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_turmas PRIMARY KEY (id),
  CONSTRAINT uq_turmas_nome UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS alunos (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  matricula VARCHAR(40) NOT NULL,
  turma_id CHAR(36) NOT NULL,
  responsavel_nome VARCHAR(120) NOT NULL DEFAULT '',
  responsavel_contato VARCHAR(80) NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  atualizado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_alunos PRIMARY KEY (id),
  CONSTRAINT uq_alunos_matricula UNIQUE (matricula),
  CONSTRAINT fk_alunos_turma FOREIGN KEY (turma_id) REFERENCES turmas (id)
);

CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON alunos (turma_id);

CREATE TABLE IF NOT EXISTS categorias_ocorrencia (
  id VARCHAR(64) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_categorias_ocorrencia PRIMARY KEY (id),
  CONSTRAINT uq_categorias_nome UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS alunos_turmas_historico (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  turma_id CHAR(36) NOT NULL,
  ano_letivo INTEGER NOT NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT pk_alunos_turmas_historico PRIMARY KEY (id),

  CONSTRAINT fk_historico_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos (id),

  CONSTRAINT fk_historico_turma
    FOREIGN KEY (turma_id) REFERENCES turmas (id),

  CONSTRAINT uq_historico_aluno_ano
    UNIQUE (aluno_id, ano_letivo)
);

CREATE INDEX IF NOT EXISTS idx_historico_aluno_id
  ON alunos_turmas_historico (aluno_id);

CREATE INDEX IF NOT EXISTS idx_historico_turma_id
  ON alunos_turmas_historico (turma_id);

CREATE INDEX IF NOT EXISTS idx_historico_ano_letivo
  ON alunos_turmas_historico (ano_letivo);

CREATE TABLE IF NOT EXISTS ocorrencias (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  prioridade prioridade_ocorrencia NOT NULL,
  descricao TEXT NOT NULL,
  local VARCHAR(160) NOT NULL DEFAULT '',
  testemunhas VARCHAR(240) NOT NULL DEFAULT '',
  status status_ocorrencia NOT NULL,
  criado_por_id CHAR(36) NOT NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  atualizado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_ocorrencias PRIMARY KEY (id),
  CONSTRAINT fk_ocorrencias_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
  CONSTRAINT fk_ocorrencias_criado_por FOREIGN KEY (criado_por_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias (status);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_aluno_id ON ocorrencias (aluno_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_criado_por_id ON ocorrencias (criado_por_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_criado_em ON ocorrencias (criado_em);

-- Historico append-only: a aplicacao so possui INSERT e SELECT para esta tabela.
-- Nao existe rota de UPDATE/DELETE em nenhuma camada (regra fundadora do sistema).
CREATE TABLE IF NOT EXISTS ocorrencia_historico (
  id CHAR(36) NOT NULL,
  ocorrencia_id CHAR(36) NOT NULL,
  status status_ocorrencia NOT NULL,
  acao VARCHAR(240) NOT NULL,
  observacao TEXT NULL,
  usuario_id CHAR(36) NOT NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_ocorrencia_historico PRIMARY KEY (id),
  CONSTRAINT fk_historico_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias (id),
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_historico_ocorrencia_id ON ocorrencia_historico (ocorrencia_id);

CREATE TABLE IF NOT EXISTS notas (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  disciplina VARCHAR(120) NOT NULL,
  valor NUMERIC(4,2) NOT NULL,
  etapa VARCHAR(40) NOT NULL,
  professor_id CHAR(36) NOT NULL,
  data DATE NOT NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_notas PRIMARY KEY (id),
  CONSTRAINT fk_notas_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
  CONSTRAINT fk_notas_professor FOREIGN KEY (professor_id) REFERENCES users (id),
  CONSTRAINT ck_notas_valor CHECK (valor >= 0 AND valor <= 10)
);

CREATE INDEX IF NOT EXISTS idx_notas_aluno_id ON notas (aluno_id);

CREATE TABLE IF NOT EXISTS faltas (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  data DATE NOT NULL,
  justificativa TEXT NULL,
  registrada_por_id CHAR(36) NOT NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_faltas PRIMARY KEY (id),
  CONSTRAINT uq_faltas_aluno_data UNIQUE (aluno_id, data),
  CONSTRAINT fk_faltas_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
  CONSTRAINT fk_faltas_registrada_por FOREIGN KEY (registrada_por_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id CHAR(36) NULL,
  metadata JSONB NOT NULL,
  criado_em TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT pk_audit_logs PRIMARY KEY (id),
  CONSTRAINT fk_audit_logs_usuario FOREIGN KEY (usuario_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs (entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_criado_em ON audit_logs (criado_em);

-- Indices funcionais: no Postgres a comparacao e sensivel a caixa, entao o LOWER()
-- das queries e obrigatorio -- e sem estes indices as buscas viram seq scan.
CREATE INDEX IF NOT EXISTS idx_users_lower_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_lower_nome ON users (LOWER(nome));
CREATE INDEX IF NOT EXISTS idx_alunos_lower_matricula ON alunos (LOWER(matricula));
CREATE INDEX IF NOT EXISTS idx_turmas_lower_nome ON turmas (LOWER(nome));

-- Categorias oficiais iniciais (DML idempotente).
INSERT INTO categorias_ocorrencia (id, nome, ativa) VALUES
  ('categoria-desrespeito', 'Desrespeito', TRUE),
  ('categoria-agressao-verbal', 'Agressão verbal', TRUE),
  ('categoria-atraso', 'Atraso', TRUE),
  ('categoria-nao-fez-atividade', 'Não fez atividade', TRUE),
  ('categoria-dano-ao-patrimonio', 'Dano ao patrimônio', TRUE),
  ('categoria-ma-conduta', 'Má conduta', TRUE)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;
