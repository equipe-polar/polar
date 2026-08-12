import { Edit } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { canAccess } from "../../app/permissions";
import { useAuth } from "../../app/providers";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import type { Turma } from "../../services/domain";
import { createTurma, listTurmas, updateTurma } from "../../services/school.service";

const initialTurmaForm = {
  id: "",
  nome: "",
  anoLetivo: String(new Date().getFullYear()),
  turno: "Manha",
  ativa: true
};

export function TurmasPage() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialTurmaForm);
  const [confirmTurma, setConfirmTurma] = useState<Turma | null>(null);
  const [editingTurmaAtiva, setEditingTurmaAtiva] = useState<boolean | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const canManage = canAccess(user?.papel, "turmas:manage");

  async function refreshData() {
    setTurmas(await listTurmas());
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await listTurmas();
        if (!active) return;
        setTurmas(data);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar turmas.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function openCreate() {
    setForm(initialTurmaForm);
    setFormError("");
    setEditingTurmaAtiva(null);
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
    setEditingTurmaAtiva(turma.ativa);
    setModalOpen(true);
  }

  function setTurmaField(field: keyof typeof initialTurmaForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function persistTurma() {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        nome: form.nome,
        anoLetivo: Number(form.anoLetivo),
        turno: form.turno
      };
      if (form.id) {
        await updateTurma(form.id, { ...payload, ativa: form.ativa });
      } else {
        await createTurma(payload);
      }
      setModalOpen(false);
      setConfirmTurma(null);
      setEditingTurmaAtiva(null);
      await refreshData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Nao foi possivel salvar a turma.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim() || !form.anoLetivo || !form.turno.trim()) {
      setFormError("Nome, ano letivo e turno sao obrigatorios.");
      return;
    }

    if (form.id && editingTurmaAtiva && !form.ativa) {
      setConfirmTurma({
        id: form.id,
        nome: form.nome,
        anoLetivo: Number(form.anoLetivo),
        turno: form.turno,
        ativa: form.ativa
      });
      return;
    }

    await persistTurma();
  }

  return (
    <>
      <PageHeader
        title="Turmas"
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Turmas" }]}
        actions={canManage ? <Button onClick={openCreate}>Nova turma</Button> : null}
      />
      {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
      <Card title="Turmas cadastradas">
        {loading ? (
          <p className="muted">Carregando turmas...</p>
        ) : (
          <Table
            data={turmas}
            columns={[
              { key: "nome", header: "Turma", render: (item) => item.nome },
              { key: "ano", header: "Ano letivo", render: (item) => item.anoLetivo },
              { key: "turno", header: "Turno", render: (item) => item.turno },
              {
                key: "acao",
                header: "Acao",
                render: (item) =>
                  canManage ? (
                    <Button variant="ghost" icon={<Edit size={18} />} onClick={() => openEdit(item)}>
                      Editar
                    </Button>
                  ) : (
                    <span className="muted">Consulta</span>
                  )
              }
            ]}
          />
        )}
      </Card>
      <Modal title={form.id ? "Editar turma" : "Nova turma"} open={modalOpen} onClose={() => setModalOpen(false)}>
        {formError ? <p className="text-danger">{formError}</p> : null}
        <form className="form-grid" onSubmit={handleSave}>
          <Input label="Nome" value={form.nome} onChange={(event) => setTurmaField("nome", event.target.value)} />
          <Input label="Ano letivo" type="number" value={form.anoLetivo} onChange={(event) => setTurmaField("anoLetivo", event.target.value)} />
          <Select
            label="Turno"
            value={form.turno}
            onChange={(event) => setTurmaField("turno", event.target.value)}
            options={[
              { label: "Manha", value: "Manha" },
              { label: "Tarde", value: "Tarde" },
              { label: "Noite", value: "Noite" },
              { label: "Integral", value: "Integral" }
            ]}
          />
          {form.id ? (
            <Select
              label="Status"
              value={form.ativa ? "true" : "false"}
              onChange={(event) => setTurmaField("ativa", event.target.value === "true")}
              options={[
                { label: "Ativa", value: "true" },
                { label: "Inativa", value: "false" }
              ]}
            />
          ) : null}
          <div className="actions-row span-2">
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar turma"}</Button>
          </div>
        </form>
      </Modal>
      <Modal
        title="Confirmar desativacao"
        open={!!confirmTurma}
        onClose={() => setConfirmTurma(null)}
      >
        <p>
          Tem certeza que deseja desativar a turma <strong>{confirmTurma?.nome}</strong>?
        </p>
        <div className="actions-row">
          <Button variant="secondary" onClick={() => setConfirmTurma(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void persistTurma()} disabled={confirmLoading || saving}>
            {confirmLoading || saving ? "Aguarde..." : "Desativar turma"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
