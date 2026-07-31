import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoPolar from "../../assets/logo-polar.svg";
import { useAuth } from "../../app/providers";
import { Button } from "../../components/ui/Button";
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
      const nextPath =
        typeof location.state === "object" && location.state && "from" in location.state
          ? String(location.state.from)
          : "/";
      navigate(nextPath);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel acessar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-about" aria-labelledby="login-about-title">
        <h1 id="login-about-title">
          Voce sabe o que e o
          <strong> P.O.L.A</strong>?
        </h1>

        <p>
          O <strong>P.O.L.A</strong> registra e acompanha ocorrencias escolares em um fluxo unico, do registro pelo
          professor ate o encerramento pela direcao.
        </p>

        <h2>Para quem registra</h2>
        <ul>
          <li>
            <strong>Registro rapido:</strong> aluno, categoria, prioridade e descricao em uma tela so.
          </li>
          <li>
            <strong>Acompanhamento:</strong> voce ve em que etapa esta cada ocorrencia que abriu.
          </li>
        </ul>

        <h2>Para a gestao</h2>
        <ul>
          <li>
            <strong>Fluxo fechado:</strong> quatro estados e tres transicoes, cada uma restrita a um papel.
          </li>
          <li>
            <strong>Historico imutavel:</strong> toda acao vira registro permanente, com autor e data.
          </li>
          <li>
            <strong>Indicadores:</strong> volume por status, prioridade e categoria, sempre no seu escopo.
          </li>
        </ul>

        <h2>Privacidade</h2>
        <p>
          Sao dados de estudantes, muitos deles menores de idade. O acesso e limitado ao papel de cada usuario e todas
          as acoes ficam auditadas.
        </p>
      </section>

      <section className="login-access">
        <div className="login-access__inner">
          <div className="login-brand">
            <img src={logoPolar} alt="" />
            <div>
              <strong>P.O.L.A</strong>
              <span>Ocorrencias institucionais</span>
            </div>
          </div>

          <div className="login-access__intro">
            <h2>Ola, novamente!</h2>
            <p>Preencha seus dados abaixo para acessar o sistema.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <Input
              label="Usuario ou e-mail"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="current-password"
            />
            {error ? (
              <p className="text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading} icon={<LogIn size={18} />}>
              {loading ? "Acessando..." : "Acessar"}
            </Button>
          </form>

          <p className="login-access__help">
            Esqueceu a senha? Procure a coordenacao da sua unidade para redefinir o acesso.
          </p>
        </div>
      </section>
    </main>
  );
}
