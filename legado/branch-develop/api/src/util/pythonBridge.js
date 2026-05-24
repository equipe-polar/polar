const { spawn } = require("child_process");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "../../../backend");
const gatewayScript = path.join(backendDir, "services", "polar_api_service.py");

function parseJsonOutput(stdout) {
  const clean = String(stdout || "").trim();
  if (!clean) {
    throw new Error("Backend Python nao retornou resposta.");
  }

  const lines = clean.split(/\r?\n/).filter(Boolean);
  const lastLine = lines[lines.length - 1];

  try {
    return JSON.parse(lastLine);
  } catch (error) {
    error.message = `Resposta invalida do backend Python: ${lastLine}`;
    throw error;
  }
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function discoverPythonCandidates() {
  const configured = process.env.PYTHON_PATH || process.env.PYTHON_BIN;
  const bareLaunchers = new Set(["py", "py.exe", "python", "python.exe"]);
  const configuredLower = String(configured || "").toLowerCase();
  const candidates = [];

  if (configured && !bareLaunchers.has(configuredLower)) {
    candidates.push(configured);
  }

  // No Windows, os atalhos de Python em WindowsApps podem retornar EPERM.
  // Por isso tentamos primeiro os caminhos reais mais comuns do instalador.
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || process.env.LocalAppData;
    const userProfile = process.env.USERPROFILE;
    if (localAppData) {
      candidates.push(path.join(localAppData, "Python", "bin", "python.exe"));
    }
    if (userProfile) {
      candidates.push(path.join(userProfile, "AppData", "Local", "Python", "bin", "python.exe"));
    }
  }

  for (const command of ["python", "py"]) {
    const result = spawnSync("where.exe", [command], {
      encoding: "utf8",
      windowsHide: true,
    });

    if (result.status === 0 && result.stdout) {
      result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((candidate) => candidates.push(candidate));
    }
  }

  if (process.platform !== "win32") {
    candidates.push(configured, "python3", "python", "py");
  }

  return unique(candidates).filter((candidate) => {
    if (/\\WindowsApps\\/i.test(candidate) || candidate.includes("\uFFFD")) {
      return false;
    }
    return !path.isAbsolute(candidate) || fs.existsSync(candidate);
  });
}

function spawnPython(candidate, args) {
  return spawn(candidate, args, {
    cwd: backendDir,
    env: process.env,
    windowsHide: true,
  });
}

function runWithCandidate(candidate, command, payload) {
  return new Promise((resolve, reject) => {
    let child;

    try {
      child = spawnPython(candidate, [gatewayScript, command, JSON.stringify(payload)]);
    } catch (error) {
      error.pythonCandidate = candidate;
      reject(error);
      return;
    }

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      error.status = 502;
      error.pythonCandidate = candidate;
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const error = new Error(stderr.trim() || `Backend Python finalizou com codigo ${code}`);
        error.status = 502;
        error.details = stdout.trim();
        error.pythonCandidate = candidate;
        reject(error);
        return;
      }

      try {
        resolve(parseJsonOutput(stdout));
      } catch (error) {
        error.status = 502;
        error.details = stderr.trim();
        error.pythonCandidate = candidate;
        reject(error);
      }
    });
  });
}

async function runPython(command, payload = {}) {
  const candidates = discoverPythonCandidates();
  let lastError;

  // A API conversa com o backend Python sempre por comando + JSON.
  for (const candidate of candidates) {
    try {
      return await runWithCandidate(candidate, command, payload);
    } catch (error) {
      lastError = error;
      if (!["EPERM", "ENOENT", "EACCES"].includes(error.code)) {
        throw error;
      }
    }
  }

  if (lastError) {
    lastError.message = `Nao foi possivel executar o Python. Ultima tentativa: ${lastError.pythonCandidate || "indefinida"}. ${lastError.message}`;
    throw lastError;
  }

  const error = new Error("Nenhum interpretador Python encontrado.");
  error.status = 502;
  throw error;
}

async function callBackend(command, payload = {}) {
  const response = await runPython(command, payload);
  if (!response.success) {
    const error = new Error(response.message || "Operacao recusada pelo backend Python.");
    error.status = response.statusCode || 400;
    error.backend = response;
    throw error;
  }
  return response;
}

module.exports = {
  callBackend,
  runPython,
};
