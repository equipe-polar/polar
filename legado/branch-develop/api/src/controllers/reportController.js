const asyncHandler = require("../util/asyncHandler");
const { backendAuth } = require("../middlewares/auth");
const { callBackend } = require("../util/pythonBridge");
const { ok } = require("../util/http");

exports.getOccurrenceReport = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("reports.occurrences", {
    auth: backendAuth(req),
    query: req.query,
  });

  return ok(res, {
    message: "Relatorio de ocorrencias gerado com sucesso",
    data: backendResponse.data,
  });
});

exports.getStudentReport = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("reports.student", {
    auth: backendAuth(req),
    id: req.params.id,
    query: req.query,
  });

  return ok(res, {
    message: "Relatorio do aluno gerado com sucesso",
    data: backendResponse.data,
  });
});
