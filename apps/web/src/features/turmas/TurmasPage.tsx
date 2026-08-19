import { Edit, SearchX } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { canAccess } from "../../app/permissions";
import { useAuth } from "../../app/providers";

import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";

import type { Aluno, Turma } from "../../services/domain";

import {
  copiarAnoLetivo,
  createTurma,
  listAlunos,
  listTurmas,
  updateTurma
} from "../../services/school.service";

const initialTurmaForm = {
  id: "",
  nome: "",
  anoLetivo: String(new Date().getFullYear()),
  turno: "Manha",
  ativa: true
};

export function TurmasPage() {
  const { user } = useAuth();

  const canManage = canAccess(
    user?.papel,
    "turmas:manage"
  );

  // =========================================================
  // ESTADO DA LISTAGEM DE TURMAS
  // =========================================================

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // ESTADO DO MODAL DE CRIAÇÃO/EDIÇÃO DE TURMA
  // =========================================================

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialTurmaForm);

  // =========================================================
  // ESTADO DE INATIVAÇÃO
  // =========================================================

  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  const [inativando, setInativando] = useState(false);

  // =========================================================
  // ESTADO DA VIRADA DE ANO
  // =========================================================

  const [viradaOpen, setViradaOpen] = useState(false);
  const [viradaLoading, setViradaLoading] = useState(false);
  const [viradaError, setViradaError] = useState("");

  const [viradaAnoOrigem, setViradaAnoOrigem] = useState(
    String(new Date().getFullYear())
  );

  const [viradaAnoDestino, setViradaAnoDestino] = useState(
    String(new Date().getFullYear() + 1)
  );

  const [viradaAlunos, setViradaAlunos] = useState<Aluno[]>([]);
  const [viradaTurmas, setViradaTurmas] = useState<Turma[]>([]);

  // turmaId da turma de origem -> IDs dos alunos escolhidos
  const [viradaComposicao, setViradaComposicao] =
    useState<Record<string, string[]>>({});

  // turmaId da turma de origem -> nome da turma de destino
  const [viradaNomes, setViradaNomes] =
    useState<Record<string, string>>({});

  // =========================================================
  // ATUALIZAR LISTA DE TURMAS
  // =========================================================

  async function refreshData() {
    const data = await listTurmas();
    setTurmas(data);
  }

  // =========================================================
  // CARREGAMENTO INICIAL
  // =========================================================

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await listTurmas();

        if (!active) {
          return;
        }

        setTurmas(data);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar turmas."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  // =========================================================
  // CRIAÇÃO/EDIÇÃO DE TURMA
  // =========================================================

  function openCreate() {
    setForm(initialTurmaForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(turma: Turma) {
    setForm({
      id: turma.id,
      nome: turma.nome,
      anoLetivo: String(turma.anoLetivo),
      turno: turma.turno,
      ativa: turma.ativa
    });

    setFormError("");
    setModalOpen(true);
  }

  function setTurmaField(
    field: keyof typeof initialTurmaForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form.nome.trim() ||
      !form.anoLetivo ||
      !form.turno.trim()
    ) {
      setFormError(
        "Nome, ano letivo e turno sao obrigatorios."
      );
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        nome: form.nome.trim(),
        anoLetivo: Number(form.anoLetivo),
        turno: form.turno.trim()
      };

      if (form.id) {
        await updateTurma(form.id, {
          ...payload,
          ativa: form.ativa
        });
      } else {
        await createTurma(payload);
      }

      setModalOpen(false);
      await refreshData();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel salvar a turma."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // PREPARAR VIRADA DE ANO
  // =========================================================

  async function openViradaAno() {
    setViradaError("");
    setViradaLoading(true);

    try {
      const [alunos, turmas] = await Promise.all([
        listAlunos(),
        listTurmas()
      ]);

      const anoOrigem = new Date().getFullYear();

      const turmasOrigem = turmas.filter(
        (turma) => turma.anoLetivo === anoOrigem
      );

      const composicao: Record<string, string[]> =
        {};

      const nomes: Record<string, string> = {};

      for (const turma of turmasOrigem) {
        const alunosDaTurma = alunos
          .filter(
            (aluno) =>
              aluno.ativo &&
              aluno.turmaId === turma.id
          )
          .map((aluno) => aluno.id);

        composicao[turma.id] = alunosDaTurma;

        nomes[turma.id] = turma.nome.replace(
          String(anoOrigem),
          String(anoOrigem + 1)
        );
      }

      setViradaAlunos(alunos);
      setViradaTurmas(turmas);
      setViradaAnoOrigem(String(anoOrigem));
      setViradaAnoDestino(String(anoOrigem + 1));
      setViradaComposicao(composicao);
      setViradaNomes(nomes);
      setViradaOpen(true);
    } catch (err) {
      setViradaError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel preparar a virada de ano."
      );
    } finally {
      setViradaLoading(false);
    }
  }

  // =========================================================
  // ALTERAR NOME DA TURMA NOVA
  // =========================================================

  function setViradaNome(
    turmaId: string,
    nome: string
  ) {
    setViradaNomes((current) => ({
      ...current,
      [turmaId]: nome
    }));
  }

  // =========================================================
  // ADICIONAR / REMOVER ALUNO DA NOVA TURMA
  // =========================================================

  function toggleAlunoNaTurma(
    turmaId: string,
    alunoId: string
  ) {
    setViradaComposicao((current) => {
      const alunosAtuais = current[turmaId] ?? [];

      // Se o aluno já está nessa turma,
      // remove.
      if (alunosAtuais.includes(alunoId)) {
        return {
          ...current,
          [turmaId]: alunosAtuais.filter(
            (id) => id !== alunoId
          )
        };
      }

      // Impede o mesmo aluno em duas turmas
      // durante a mesma virada.
      const jaEstaEmOutraTurma =
        Object.entries(current).some(
          ([outraTurmaId, alunos]) =>
            outraTurmaId !== turmaId &&
            alunos.includes(alunoId)
        );

      if (jaEstaEmOutraTurma) {
        return current;
      }

      return {
        ...current,
        [turmaId]: [
          ...alunosAtuais,
          alunoId
        ]
      };
    });
  }

  // =========================================================
  // CONFIRMAR VIRADA
  // =========================================================

  async function handleConfirmVirada() {
    const anoOrigem = Number(viradaAnoOrigem);
    const anoDestino = Number(viradaAnoDestino);

    if (
      !Number.isInteger(anoOrigem) ||
      !Number.isInteger(anoDestino)
    ) {
      setViradaError(
        "Informe anos letivos validos."
      );
      return;
    }

    if (anoDestino <= anoOrigem) {
      setViradaError(
        "O ano de destino deve ser maior que o ano de origem."
      );
      return;
    }

    const turmasOrigem = viradaTurmas.filter(
      (turma) => turma.anoLetivo === anoOrigem
    );

    if (turmasOrigem.length === 0) {
      setViradaError(
        `Nenhuma turma encontrada para o ano ${anoOrigem}.`
      );
      return;
    }

    // Verifica nomes antes de enviar.
    for (const turma of turmasOrigem) {
      const nome =
        viradaNomes[turma.id]?.trim();

      if (!nome) {
        setViradaError(
          `Informe o nome da nova turma "${turma.nome}".`
        );
        return;
      }
    }

    setViradaLoading(true);
    setViradaError("");

    try {
      await copiarAnoLetivo({
        anoOrigem,
        anoDestino,

        turmas: turmasOrigem.map(
          (turma) => ({
            origemId: turma.id,

            nome: (
              viradaNomes[turma.id] ??
              turma.nome.replace(
                String(anoOrigem),
                String(anoDestino)
              )
            ).trim(),

            turno: turma.turno,

            alunos:
              viradaComposicao[turma.id] ??
              []
          })
        )
      });

      setViradaOpen(false);
      await refreshData();
    } catch (err) {
      setViradaError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel concluir a virada de ano."
      );
    } finally {
      setViradaLoading(false);
    }
  }

  // =========================================================
  // INATIVAR TURMA
  // =========================================================

  function handleInativarClick(
    id: string,
    nome: string
  ) {
    setConfirmTarget({
      id,
      nome
    });
  }

  async function handleConfirmInativar() {
    if (!confirmTarget) {
      return;
    }

    setInativando(true);
    setError("");

    try {
      await updateTurma(
        confirmTarget.id,
        {
          ativa: false
        }
      );

      await refreshData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel inativar a turma."
      );
    } finally {
      setInativando(false);
      setConfirmTarget(null);
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <PageHeader
        title="Turmas"
        breadcrumb={[
          {
            label: "Inicio",
            to: "/"
          },
          {
            label: "Turmas"
          }
        ]}
        actions={
          canManage ? (
            <div className="actions-row">
              <Button
                variant="secondary"
                onClick={openViradaAno}
              >
                Virar ano letivo
              </Button>

              <Button
                onClick={openCreate}
              >
                Nova turma
              </Button>
            </div>
          ) : null
        }
      />

      {/* ERRO GERAL */}
      {error ? (
        <Card className="state-message state-message--danger">
          {error}
        </Card>
      ) : null}

      {/* =====================================================
          LISTA DE TURMAS
          ===================================================== */}

      <Card title="Turmas cadastradas">
        {loading ? (
          <p className="muted">
            Carregando turmas...
          </p>
        ) : turmas.length === 0 ? (
          <div className="empty-state">
            <SearchX
              size={32}
              aria-hidden="true"
            />

            <strong>
              Nenhuma turma cadastrada.
            </strong>

            <span>
              Assim que houver turmas cadastradas,
              elas aparecerão aqui.
            </span>
          </div>
        ) : (
          <Table
            data={turmas}
            columns={[
              {
                key: "nome",
                header: "Turma",
                render: (item) =>
                  item.nome
              },
              {
                key: "ano",
                header: "Ano letivo",
                render: (item) =>
                  item.anoLetivo
              },
              {
                key: "turno",
                header: "Turno",
                render: (item) =>
                  item.turno
              },
              {
                key: "acao",
                header: "Acao",
                render: (item) =>
                  canManage ? (
                    <div className="actions-row">
                      <Button
                        variant="ghost"
                        icon={
                          <Edit size={18} />
                        }
                        onClick={() =>
                          openEdit(item)
                        }
                      >
                        Editar
                      </Button>

                      {item.ativa ? (
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleInativarClick(
                              item.id,
                              item.nome
                            )
                          }
                        >
                          Inativar
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="muted">
                      Consulta
                    </span>
                  )
              }
            ]}
          />
        )}
      </Card>

      {/* =====================================================
          MODAL: NOVA / EDITAR TURMA
          ===================================================== */}

      <Modal
        title={
          form.id
            ? "Editar turma"
            : "Nova turma"
        }
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
      >
        {formError ? (
          <p className="text-danger">
            {formError}
          </p>
        ) : null}

        <form
          className="form-grid"
          onSubmit={handleSave}
        >
          <Input
            label="Nome"
            value={form.nome}
            onChange={(event) =>
              setTurmaField(
                "nome",
                event.target.value
              )
            }
          />

          <Input
            label="Ano letivo"
            type="number"
            value={form.anoLetivo}
            onChange={(event) =>
              setTurmaField(
                "anoLetivo",
                event.target.value
              )
            }
          />

          <Select
            label="Turno"
            value={form.turno}
            onChange={(event) =>
              setTurmaField(
                "turno",
                event.target.value
              )
            }
            options={[
              {
                label: "Manha",
                value: "Manha"
              },
              {
                label: "Tarde",
                value: "Tarde"
              },
              {
                label: "Noite",
                value: "Noite"
              },
              {
                label: "Integral",
                value: "Integral"
              }
            ]}
          />

          {form.id ? (
            <Select
              label="Status"
              value={
                form.ativa
                  ? "true"
                  : "false"
              }
              onChange={(event) =>
                setTurmaField(
                  "ativa",
                  event.target.value ===
                    "true"
                )
              }
              options={[
                {
                  label: "Ativa",
                  value: "true"
                },
                {
                  label: "Inativa",
                  value: "false"
                }
              ]}
            />
          ) : null}

          <div className="actions-row span-2">
            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : "Salvar turma"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =====================================================
          MODAL: VIRADA DE ANO
          ===================================================== */}

      <Modal
        title="Virar ano letivo"
        open={viradaOpen}
        onClose={() =>
          setViradaOpen(false)
        }
      >
        {viradaError ? (
          <p className="text-danger">
            {viradaError}
          </p>
        ) : null}

        {/* ANOS */}
        <div className="form-grid">
          <Input
            label="Ano de origem"
            type="number"
            value={viradaAnoOrigem}
            onChange={(event) =>
              setViradaAnoOrigem(
                event.target.value
              )
            }
          />

          <Input
            label="Ano de destino"
            type="number"
            value={viradaAnoDestino}
            onChange={(event) =>
              setViradaAnoDestino(
                event.target.value
              )
            }
          />
        </div>

        {/* TURMAS */}
        <div>
          {viradaTurmas
            .filter(
              (turma) =>
                turma.anoLetivo ===
                Number(
                  viradaAnoOrigem
                )
            )
            .map((turma) => {
              const alunosSelecionados =
                viradaComposicao[
                  turma.id
                ] ?? [];

              const alunosDaTurma =
                viradaAlunos.filter(
                  (aluno) =>
                    aluno.ativo &&
                    aluno.turmaId ===
                      turma.id
                );

              const idsTurmasOrigem =
                new Set(
                  viradaTurmas
                    .filter(
                      (item) =>
                        item.anoLetivo ===
                        Number(
                          viradaAnoOrigem
                        )
                    )
                    .map(
                      (item) =>
                        item.id
                    )
                );

              const alunosDaOrigem =
                viradaAlunos.filter(
                  (aluno) =>
                    aluno.ativo &&
                    idsTurmasOrigem.has(
                      aluno.turmaId
                    )
                );

              const alunosDisponiveis =
                alunosDaOrigem.filter(
                  (aluno) => {
                    if (
                      alunosSelecionados.includes(
                        aluno.id
                      )
                    ) {
                      return false;
                    }

                    const estaEmOutraTurma =
                      Object.entries(
                        viradaComposicao
                      ).some(
                        ([
                          outraTurmaId,
                          alunos
                        ]) =>
                          outraTurmaId !==
                            turma.id &&
                          alunos.includes(
                            aluno.id
                          )
                      );

                    return !estaEmOutraTurma;
                  }
                );

              return (
                <Card
                  key={turma.id}
                  title={turma.nome}
                >
                  {/* NOME DA NOVA TURMA */}
                  <Input
                    label="Nome da nova turma"
                    value={
                      viradaNomes[
                        turma.id
                      ] ??
                      turma.nome.replace(
                        viradaAnoOrigem,
                        viradaAnoDestino
                      )
                    }
                    onChange={(event) =>
                      setViradaNome(
                        turma.id,
                        event.target.value
                      )
                    }
                  />

                  <p className="muted">
                    Alunos selecionados:{" "}
                    {
                      alunosSelecionados.length
                    }
                  </p>

                  {/* ALUNOS ATUAIS */}
                  {alunosDaTurma.length >
                  0 ? (
                    <div className="form-grid">
                      {alunosDaTurma
                        .filter((aluno) =>
                          alunosSelecionados.includes(
                            aluno.id
                          )
                        )
                        .map((aluno) => (
                          <div
                            key={aluno.id}
                            className="actions-row"
                          >
                            <span>
                              {aluno.nome}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                toggleAlunoNaTurma(
                                  turma.id,
                                  aluno.id
                                )
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="muted">
                      Nenhum aluno selecionado.
                    </p>
                  )}

                  {/* ADICIONAR ALUNO */}
                  {alunosDisponiveis.length >
                  0 ? (
                    <Select
                      label="Adicionar aluno"
                      value=""
                      onChange={(event) => {
                        const alunoId =
                          event.target.value;

                        if (!alunoId) {
                          return;
                        }

                        toggleAlunoNaTurma(
                          turma.id,
                          alunoId
                        );
                      }}
                      options={[
                        {
                          label:
                            "Selecione um aluno",
                          value: ""
                        },
                        ...alunosDisponiveis.map(
                          (aluno) => ({
                            label: `${aluno.nome} (${aluno.matricula})`,
                            value: aluno.id
                          })
                        )
                      ]}
                    />
                  ) : null}
                </Card>
              );
            })}
        </div>

        {/* BOTÕES */}
        <div className="actions-row">
          <Button
            variant="secondary"
            onClick={() =>
              setViradaOpen(false)
            }
            disabled={viradaLoading}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleConfirmVirada}
            disabled={viradaLoading}
          >
            {viradaLoading
              ? "Confirmando..."
              : "Confirmar virada"}
          </Button>
        </div>
      </Modal>

      {/* =====================================================
          MODAL: CONFIRMAÇÃO DE INATIVAÇÃO
          ===================================================== */}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Inativar turma"
        message={`Tem certeza que deseja inativar a turma "${confirmTarget?.nome}"? Essa ação pode ser revertida depois.`}
        onConfirm={
          handleConfirmInativar
        }
        onCancel={() =>
          setConfirmTarget(null)
        }
        loading={inativando}
      />
    </>
  );
}