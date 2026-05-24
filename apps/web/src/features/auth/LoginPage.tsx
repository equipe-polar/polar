import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoPolar from "../../assets/logo-polar.svg";
import { useAuth } from "../../app/providers";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ApiError } from "../../services/api";
import { loginRequest } from "./auth.service";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticatedUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginRequest(identifier, senha);
      setAuthenticatedUser(result.user);
      const nextPath = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/";
      navigate(nextPath);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel acessar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <img src={logoPolar} alt="" />
          <div>
            <strong>P.O.L.A</strong>
            <span>Ocorrencias institucionais</span>
          </div>
        </div>
        <Card>
          <form className="page-grid" onSubmit={handleSubmit}>
            <Input label="Usuario ou e-mail" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" />
            <Input label="Senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" />
            {error ? <p className="text-danger" role="alert">{error}</p> : null}
            <Button type="submit" disabled={loading} icon={<LogIn size={18} />}>
              Acessar
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
