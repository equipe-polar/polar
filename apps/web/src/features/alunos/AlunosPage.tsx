import { Eye } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { canAccess } from "../../app/permissions";
import { useAuth } from "../../app/providers";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import type { AlunoDetalhado, Turma } from "../../services/domain";
import { createAluno, listAlunosDetalhados, listTurmas, updateAluno } from "../../services/school.service";

const initialAlunoForm = {
  nome: "",
  matricula: "",
  turmaId: "",
  responsavelNome: "",
  responsavelContato: ""
};

export function AlunosPage() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [turma, setTurma] = useState("");
  const [alunos, setAlunos] = useState<AlunoDetalhado[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialAlunoForm);
  const canManage = canAccess(user?.papel, "alunos:manage");

  // Estado do modal de confirmação de inativação
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; nome: string } | null>(null);
  const [inativando, setInativando] = useState(false);

  async function refreshData() {
    const [nextAlunos, nextTurmas] = await Promise.all([listAlunosDetalhados(), listTurmas()]);
    setAlunos(nextAlunos);
    setTurmas(nextTurmas);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextAlunos, nextTurmas] = await Promise.all([listAlunosDetalhados(), listTurmas()]);
        if (!active) return;
        setAlunos(nextAlunos);
        setTurmas(nextTurmas);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar alunos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const data = useMemo(
    () =>
      alunos.filter(
        (aluno) =>
          aluno.nome.toLowerCase().includes(busca.toLowerCase()) &&
          (!turma || aluno.turmaId === turma)
      ),
    [alunos, busca, turma]
  );

  function setAlunoField(field: keyof typeof initialAlunoForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateAluno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim() || !form.matricula.trim() || !form.turmaId) {
      setFormError("Nome, matricula e turma sao obrigatorios.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await createAluno(form);
      setModalOpen(false);
      setForm(initialAlunoForm);
      await refreshData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Nao foi possivel criar o aluno.");
    } finally {
      setSaving(false);
    }
  }

  // Abre o modal de confirmação — não inativa nada ainda
  function handleInativarClick(id: string, nome: string) {
    setConfirmTarget({ id, nome });
  }

  // Só executa a inativação de fato após clique em "Confirmar" no modal
  async function handleConfirmInativar() {
    if (!confirmTarget) return;
    setInativando(true);
    setError("");
    try {
      await updateAluno(confirmTarget.id, { ativo: false });
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel inativar o aluno.");
    } finally {
      setInativando(false);
      setConfirmTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Consulta e acompanhamento escolar."
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Alunos" }]}
      />
      <div className="page-grid">
        <Card title="Filtros">
          <div className="form-grid">
            <Input label="Busca" value={busca} onChange={(event) => setBusca(event.target.value)} />
            <Select
              label="Turma"
              value={turma}
              onChange={(event) => setTurma(event.target.value)}
              options={[{ label: "Todas", value: "" }, ...turmas.map((item) => ({ label: item.nome, value: item.id }))]}
            />
          </div>
        </Card>
        {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
        <Card title="Lista de alunos" action={canManage ? <Button variant="secondary" onClick={() => setModalOpen(true)}>Novo aluno</Button> : null}>
          {loading ? (
            <p className="muted">Carregando alunos...</p>
          ) : (
            <Table
              data={data}
              columns={[
                { key: "nome", header: "Nome", render: (item) => item.nome },
                { key: "matricula", header: "Matricula", render: (item) => item.matricula },
                { key: "turma", header: "Turma", render: (item) => item.turma },
                {
                  key: "acao",
                  header: "Acao",
                  render: (item) => (
                    <div className="actions-row">
                      <Link to={`/alunos/${item.id}`}>
                        <Button variant="ghost" icon={<Eye size={18} />}>
                          Historico
                        </Button>
                      </Link>
                      {canManage ? (
                        <Button variant="danger" onClick={() => handleInativarClick(item.id, item.nome)}>
                          Inativar
                        </Button>
                      ) : null}
                    </div>
                  )
                }
              ]}
            />
          )}
        </Card>
      </div>
      <Modal title="Novo aluno" open={modalOpen} onClose={() => setModalOpen(false)}>
        {formError ? <p className="text-danger">{formError}</p> : null}
        <form className="form-grid" onSubmit={handleCreateAluno}>
          <Input label="Nome" value={form.nome} onChange={(event) => setAlunoField("nome", event.target.value)} />
          <Input label="Matricula" value={form.matricula} onChange={(event) => setAlunoField("matricula", event.target.value)} />
          <Select
            label="Turma"
            value={form.turmaId}
            onChange={(event) => setAlunoField("turmaId", event.target.value)}
            options={[{ label: "Selecione", value: "" }, ...turmas.map((item) => ({ label: item.nome, value: item.id }))]}
          />
          <Input label="Responsavel" value={form.responsavelNome} onChange={(event) => setAlunoField("responsavelNome", event.target.value)} />
          <Input label="Contato do responsavel" value={form.responsavelContato} onChange={(event) => setAlunoField("responsavelContato", event.target.value)} />
          <div className="actions-row span-2">
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar aluno"}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirmTarget}
        title="Inativar aluno"
        message={`Tem certeza que deseja inativar o aluno "${confirmTarget?.nome}"? Essa ação pode ser revertida depois.`}
        onConfirm={handleConfirmInativar}
        onCancel={() => setConfirmTarget(null)}
        loading={inativando}
      />
    </>
  );
}