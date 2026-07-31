/**
 * Iniciais para o avatar: primeira letra do primeiro e do ultimo nome relevante.
 * Preposicoes ("dos", "de", "da") sao ignoradas para que "Islan Max dos Santos
 * Costa" vire "IC" e nao "ID".
 */
const preposicoes = new Set(["de", "da", "do", "das", "dos", "e"]);

export function iniciaisDe(nome: string | undefined): string {
  if (!nome) return "?";
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => !preposicoes.has(parte.toLowerCase()));

  if (partes.length === 0) return "?";
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

const rotulosDePapel: Record<string, string> = {
  PROFESSOR: "Professor",
  COORDENADOR: "Coordenacao",
  DIRETOR: "Direcao",
  ADM: "Administracao",
  ALUNO: "Estudante"
};

export function rotuloDePapel(papel: string | undefined): string {
  if (!papel) return "Perfil";
  return rotulosDePapel[papel] ?? papel;
}
