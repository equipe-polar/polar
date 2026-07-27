-- POLAR - Schema relacional oficial (MySQL 8+)
-- Charset utf8mb4: obrigatorio para acentuacao PT-BR ("Não fez atividade", "Dano ao patrimônio").
-- IDs: CHAR(36) UUID gerados pela aplicacao (novoId()).
-- Datas: DATETIME(3) em UTC, geradas pela aplicacao (backend e a autoridade de data).
--
-- DDL deste arquivo cobre as 11 tabelas do sistema.
-- Executar com: mysql -u <user> -p <database> < database/schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  papel ENUM('PROFESSOR', 'COORDENADOR', 'DIRETOR', 'ADM') NOT NULL,
  senha_hash VARCHAR(100) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  precisa_trocar_senha TINYINT(1) NOT NULL DEFAULT 1,
  tentativas_login_invalidas INT NOT NULL DEFAULT 0,
  bloqueado_ate DATETIME(3) NULL,
  ultimo_login_em DATETIME(3) NULL,
  criado_em DATETIME(3) NOT NULL,
  atualizado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS turmas (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  ano_letivo INT NOT NULL,
  turno VARCHAR(40) NOT NULL,
  ativa TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME(3) NOT NULL,
  atualizado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_turmas_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alunos (
  id CHAR(36) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  matricula VARCHAR(40) NOT NULL,
  turma_id CHAR(36) NOT NULL,
  responsavel_nome VARCHAR(120) NOT NULL DEFAULT '',
  responsavel_contato VARCHAR(80) NOT NULL DEFAULT '',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME(3) NOT NULL,
  atualizado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alunos_matricula (matricula),
  KEY idx_alunos_turma_id (turma_id),
  CONSTRAINT fk_alunos_turma FOREIGN KEY (turma_id) REFERENCES turmas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias_ocorrencia (
  id VARCHAR(64) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  ativa TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ocorrencias (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  prioridade ENUM('BAIXA', 'MEDIA', 'ALTA') NOT NULL,
  descricao TEXT NOT NULL,
  local VARCHAR(160) NOT NULL DEFAULT '',
  testemunhas VARCHAR(240) NOT NULL DEFAULT '',
  status ENUM('REGISTRADA', 'EM_ANALISE', 'RESOLVIDA', 'ENCERRADA') NOT NULL,
  criado_por_id CHAR(36) NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  atualizado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ocorrencias_status (status),
  KEY idx_ocorrencias_aluno_id (aluno_id),
  KEY idx_ocorrencias_criado_por_id (criado_por_id),
  KEY idx_ocorrencias_criado_em (criado_em),
  CONSTRAINT fk_ocorrencias_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
  CONSTRAINT fk_ocorrencias_criado_por FOREIGN KEY (criado_por_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historico append-only: a aplicacao so possui INSERT e SELECT para esta tabela.
-- Nao existe rota de UPDATE/DELETE em nenhuma camada (regra fundadora do sistema).
CREATE TABLE IF NOT EXISTS ocorrencia_historico (
  id CHAR(36) NOT NULL,
  ocorrencia_id CHAR(36) NOT NULL,
  status ENUM('REGISTRADA', 'EM_ANALISE', 'RESOLVIDA', 'ENCERRADA') NOT NULL,
  acao VARCHAR(240) NOT NULL,
  observacao TEXT NULL,
  usuario_id CHAR(36) NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_historico_ocorrencia_id (ocorrencia_id),
  CONSTRAINT fk_historico_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias (id),
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notas (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  disciplina VARCHAR(120) NOT NULL,
  valor DECIMAL(4,2) NOT NULL,
  etapa VARCHAR(40) NOT NULL,
  professor_id CHAR(36) NOT NULL,
  data DATE NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notas_aluno_id (aluno_id),
  CONSTRAINT fk_notas_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
  CONSTRAINT fk_notas_professor FOREIGN KEY (professor_id) REFERENCES users (id),
  CONSTRAINT ck_notas_valor CHECK (valor >= 0 AND valor <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faltas (
  id CHAR(36) NOT NULL,
  aluno_id CHAR(36) NOT NULL,
  data DATE NOT NULL,
  justificativa TEXT NULL,
  registrada_por_id CHAR(36) NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_faltas_aluno_data (aluno_id, data),
  CONSTRAINT fk_faltas_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
  CONSTRAINT fk_faltas_registrada_por FOREIGN KEY (registrada_por_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_permissions (
  id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NOT NULL,
  permissao VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_permissions (usuario_id, permissao),
  CONSTRAINT fk_user_permissions_usuario FOREIGN KEY (usuario_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id CHAR(36) NULL,
  metadata JSON NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_audit_logs_entidade (entidade, entidade_id),
  KEY idx_audit_logs_criado_em (criado_em),
  CONSTRAINT fk_audit_logs_usuario FOREIGN KEY (usuario_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensagem TEXT NOT NULL,
  destinatario_id CHAR(36) NULL,
  ocorrencia_id CHAR(36) NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  criado_por_id CHAR(36) NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_destinatario (destinatario_id),
  CONSTRAINT fk_notifications_destinatario FOREIGN KEY (destinatario_id) REFERENCES users (id),
  CONSTRAINT fk_notifications_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias (id),
  CONSTRAINT fk_notifications_criado_por FOREIGN KEY (criado_por_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorias oficiais iniciais (DML idempotente).
INSERT INTO categorias_ocorrencia (id, nome, ativa) VALUES
  ('categoria-desrespeito', 'Desrespeito', 1),
  ('categoria-agressao-verbal', 'Agressão verbal', 1),
  ('categoria-atraso', 'Atraso', 1),
  ('categoria-nao-fez-atividade', 'Não fez atividade', 1),
  ('categoria-dano-ao-patrimonio', 'Dano ao patrimônio', 1),
  ('categoria-ma-conduta', 'Má conduta', 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
