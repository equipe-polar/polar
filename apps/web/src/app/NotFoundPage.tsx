import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Pagina nao encontrada" />
      <Card>
        <p>A rota solicitada nao existe.</p>
        <Link to="/">
          <Button>Voltar ao dashboard</Button>
        </Link>
      </Card>
    </>
  );
}
