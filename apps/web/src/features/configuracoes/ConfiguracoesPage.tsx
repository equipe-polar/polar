import { Save } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

export function ConfiguracoesPage() {
  return (
    <>
      <PageHeader title="Configuracoes" />
      <Card title="Dados institucionais">
        <div className="form-grid">
          <Input label="Nome da instituicao" defaultValue="Escola P.O.L.A" />
          <Input label="Ano letivo" defaultValue="2026" />
          <Select
            label="Padrao de notificacao"
            defaultValue="sistema"
            options={[
              { label: "Sistema", value: "sistema" },
              { label: "Sistema e e-mail", value: "email" }
            ]}
          />
          <Input label="Responsavel administrativo" defaultValue="Secretaria escolar" />
          <div className="actions-row span-2">
            <Button icon={<Save size={18} />}>Salvar</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
