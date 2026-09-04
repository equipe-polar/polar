import { Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { listAlunosDetalhados, listTurmas } from "../../services/school.service";
import { PRIORIDADES_OCORRENCIA, type AlunoDetalhado, type PrioridadeOcorrencia, type Turma } from "../../services/domain";
import { createOcorrencia } from "./ocorrencias.service";

const schema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
  turmaId: z.string().min(1, "Selecione uma turma."),
  categoria: z.string().min(1, "Informe a categoria."),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"], { required_error: "Informe a prioridade." }),
  descricao: z.string().min(10, "Descreva a ocorrencia com pelo menos 10 caracteres."),
  local: z.string().min(1, "Informe o local."),
  testemunhas: z.string().optional()
});

type FormState = z.infer<typeof schema>;

const initialState: FormState = {
  alunoId: "",
  turmaId: "",
  categoria: "",
  prioridade: "MEDIA",
  descricao: "",
  local: "",
  testemunhas: ""
};

export function NovaOcorrenciaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [alunos, setAlunos] = useState<AlunoDetalhado[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextAlunos, nextTurmas] = await Promise.all([listAlunosDetalhados(), listTurmas()]);
        if (!active) return;
        setAlunos(nextAlunos);
        setTurmas(nextTurmas);
        setApiError("");
      } catch (err) {
        if (!active) return;
        setApiError(err instanceof Error ? err.message : "Nao foi possivel carregar alunos e turmas.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function setField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setAluno(alunoId: string) {
    const aluno = alunos.find((item) => item.id === alunoId);
    setForm((current) => ({
      ...current,
      alunoId,
      turmaId: aluno?.turmaId ?? current.turmaId
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([key, value]) => [key, value?.[0]])));
      return;
    }

    setSubmitting(true);
    setErrors({});
    setApiError("");
    try {
      const ocorrencia = await createOcorrencia({
        alunoId: result.data.alunoId,
        categoria: result.data.categoria,
        prioridade: result.data.prioridade as PrioridadeOcorrencia,
        descricao: result.data.descricao,
        local: result.data.local,
        testemunhas: result.data.testemunhas
      });
      navigate(`/ocorrencias/${ocorrencia.id}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Nao foi possivel registrar a ocorrencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Nova ocorrencia" breadcrumb={[{ label: "Inicio", to: "/" }, { label: "Ocorrencias", to: "/ocorrencias" }, { label: "Nova" }]} />
      <Card>
        {apiError ? <p className="text-danger">{apiError}</p> : null}
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <Select
            label="Aluno"
            value={form.alunoId}
            onChange={(event) => setAluno(event.target.value)}
            error={errors.alunoId}
            disabled={loading}
            options={[{ label: loading ? "Carregando..." : "Selecione", value: "" }, ...alunos.map((aluno) => ({ label: aluno.nome, value: aluno.id }))]}
          />
          <Select
            label="Turma"
            value={form.turmaId}
            onChange={(event) => setField("turmaId", event.target.value)}
            error={errors.turmaId}
            disabled={loading}
            options={[{ label: loading ? "Carregando..." : "Selecione", value: "" }, ...turmas.map((turma) => ({ label: turma.nome, value: turma.id }))]}
          />
          <Input label="Categoria" value={form.categoria} onChange={(event) => setField("categoria", event.target.value)} error={errors.categoria} />
          <Select
            label="Prioridade"
            value={form.prioridade}
            onChange={(event) => setField("prioridade", event.target.value)}
            error={errors.prioridade}
            options={PRIORIDADES_OCORRENCIA.map(({ label, value }) => ({ label, value }))}
          />
          <Input label="Local" value={form.local} onChange={(event) => setField("local", event.target.value)} error={errors.local} />
          <Input label="Testemunhas" value={form.testemunhas} onChange={(event) => setField("testemunhas", event.target.value)} />
          <label className="ui-field span-2" htmlFor="descricao">
            <span>Descricao</span>
            <textarea id="descricao" value={form.descricao} onChange={(event) => setField("descricao", event.target.value)} aria-invalid={Boolean(errors.descricao)} />
            {errors.descricao ? <small className="ui-field__error">{errors.descricao}</small> : null}
          </label>
          <div className="actions-row span-2">
            <Button type="submit" disabled={submitting} icon={<Save size={18} />}>
              {submitting ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
