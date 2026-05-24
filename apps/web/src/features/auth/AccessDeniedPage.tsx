import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function AccessDeniedPage() {
  return (
    <>
      <PageHeader title="Acesso negado" />
      <Card>
        <p>Seu perfil nao possui permissao para acessar esta area.</p>
        <Link to="/">
          <Button>Voltar ao dashboard</Button>
        </Link>
      </Card>
    </>
  );
}
