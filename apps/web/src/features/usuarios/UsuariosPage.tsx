import { UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import type { PapelUsuario, Usuario } from "../../services/domain";
import { createUsuario, listUsuarios, updateUsuario } from "../../services/school.service";

const initialUserForm = {
  nome: "",
  email: "",
  papel: "PROFESSOR" as PapelUsuario,
  senha: ""
};

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  *adicionado por Kauã*
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialUserForm);

  async function refreshData() {
    setUsuarios(await listUsuarios());
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await listUsuarios();
        if (!active) return;
        setUsuarios(data);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar usuarios.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function setUserField(field: keyof typeof initialUserForm, value: string) {
    setForm((current) => ({ ...current, [field]: field === "papel" ? (value as PapelUsuario) : value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || form.senha.length < 8) {
      setFormError("Nome, e-mail e senha com pelo menos 8 caracteres sao obrigatorios.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await createUsuario(form);
      setModalOpen(false);
      setForm(initialUserForm);
      await refreshData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Nao foi possivel criar o usuario.");
    } finally {
      setSaving(false);
    }
  }

 *alterado por Kauã*
  async function toggleStatus(usuario: Usuario) {
    setError("");
    try {
        await updateUsuario(usuario.id, { ativo: !usuario.ativo });
        await refreshData();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel atualizar o usuario.");
    }
}

async function handleConfirmToggle() {
    if (!selectedUser) return;

    await toggleStatus(selectedUser);

    setConfirmModalOpen(false);
    setSelectedUser(null);
}
  return (
    <>
      <PageHeader
        title="Usuarios"
        breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Usuarios" }]}
        actions={<Button icon={<UserPlus size={18} />} onClick={() => setModalOpen(true)}>Novo usuario</Button>}
      />
      {error ? <Card className="state-message state-message--danger">{error}</Card> : null}
      <Card title="Gestao de acessos">
        {loading ? (
          <p className="muted">Carregando usuarios...</p>
        ) : (
          <Table
            data={usuarios}
            columns={[
              { key: "nome", header: "Nome", render: (item) => item.nome },
              { key: "email", header: "E-mail", render: (item) => item.email },
              { key: "papel", header: "Perfil", render: (item) => <Badge tone="info">{item.papel}</Badge> },
              { key: "status", header: "Status", render: (item) => <Badge tone={item.ativo ? "success" : "default"}>{item.ativo ? "Ativo" : "Inativo"}</Badge> },
              {
                key: "acao",
                header: "Acao",
                render: (item) => (
                  *alterado por Kauã*
             <Button
             variant="ghost"
             onClick={() => {
              setSelectedUser(item);
              setConfirmModalOpen(true);
          }}
         >
    {item.ativo ? "Desativar" : "Ativar"}
</Button>
                )
              }
            ]}
          />
        )}
      </Card>
      <Modal title="Novo usuario" open={modalOpen} onClose={() => setModalOpen(false)}>
        {formError ? <p className="text-danger">{formError}</p> : null}
        <form className="form-grid" onSubmit={handleCreate}>
          <Input label="Nome" value={form.nome} onChange={(event) => setUserField("nome", event.target.value)} />
          <Input label="E-mail" type="email" value={form.email} onChange={(event) => setUserField("email", event.target.value)} />
          <Select
            label="Perfil"
            value={form.papel}
            onChange={(event) => setUserField("papel", event.target.value)}
            options={[
              { label: "PROFESSOR", value: "PROFESSOR" },
              { label: "COORDENADOR", value: "COORDENADOR" },
              { label: "DIRETOR", value: "DIRETOR" },
              { label: "ADM", value: "ADM" },
              { label: "ALUNO", value: "ALUNO" }
            ]}
          />
          <Input label="Senha temporaria" type="password" value={form.senha} onChange={(event) => setUserField("senha", event.target.value)} />
          <div className="actions-row span-2">
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar usuario"}</Button>
          </div>
        </form>
      </Modal>
      *adicionado por Kauã*
      <Modal
  title="Confirmar alteração"
  open={confirmModalOpen}
  onClose={() => {
    setConfirmModalOpen(false);
    setSelectedUser(null);
  }}
>
  <p>
    Tem certeza que deseja{" "}
    {selectedUser?.ativo ? "desativar" : "ativar"} este usuário?
  </p>

  <div className="actions-row span-2">
    <Button
      variant="ghost"
      onClick={() => {
        setConfirmModalOpen(false);
        setSelectedUser(null);
      }}
    >
      Cancelar
    </Button>

    <Button onClick={() => void handleConfirmToggle()}>
      Confirmar
    </Button>
  </div>
</Modal>
    </>
  );
}
