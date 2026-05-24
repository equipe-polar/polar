function sanitizeString(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeObject(input) {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeObject(value)])
    );
  }

  return typeof input === "string" ? sanitizeString(input, 2000) : input;
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || sanitizeString(String(value)) === "";
  });

  if (missing.length) {
    const error = new Error(`Campos obrigatorios ausentes: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function normalizeRole(value) {
  const role = sanitizeString(String(value || "PROFESSOR")).toUpperCase();
  const aliases = {
    ADMIN: "ADM",
    ADMINISTRADOR: "ADM",
    PROFESSOR: "PROFESSOR",
    COORDENADOR: "COORDENADOR",
    DIRETOR: "DIRETOR",
    SECRETARIO: "SECRETARIO",
    "SECRETARIO(A)": "SECRETARIO",
  };
  return aliases[role] || role;
}

function normalizeSeverity(value) {
  const raw = sanitizeString(String(value || "media")).toLowerCase();
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["baixa", "low"].includes(normalized)) return "baixa";
  if (["alta", "high"].includes(normalized)) return "alta";
  return "media";
}

function normalizeStatus(value) {
  const status = sanitizeString(String(value || "REGISTRADA"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");

  const allowed = new Set(["REGISTRADA", "EM_ANALISE", "RESOLVIDA", "ENCERRADA"]);
  return allowed.has(status) ? status : "REGISTRADA";
}

module.exports = {
  isEmail,
  normalizeRole,
  normalizeSeverity,
  normalizeStatus,
  requireFields,
  sanitizeObject,
  sanitizeString,
};
