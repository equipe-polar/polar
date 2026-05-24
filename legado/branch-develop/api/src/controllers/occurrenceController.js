const Occurrence = require("../model/Occurrence");
const asyncHandler = require("../util/asyncHandler");
const { backendAuth } = require("../middlewares/auth");
const { callBackend } = require("../util/pythonBridge");
const { sendOccurrenceToExternalApi } = require("../util/externalService");
const { noContent, ok } = require("../util/http");

exports.listOccurrences = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("occurrences.list", {
    auth: backendAuth(req),
    query: req.query,
  });

  return ok(res, {
    message: "Ocorrencias listadas com sucesso",
    data: backendResponse.data,
  });
});

exports.getOccurrenceById = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("occurrences.get", {
    auth: backendAuth(req),
    id: req.params.id,
  });

  return ok(res, {
    message: "Ocorrencia carregada com sucesso",
    data: backendResponse.data,
  });
});

exports.createOccurrence = asyncHandler(async (req, res) => {
  // Primeiro persistimos localmente via Python; depois tentamos a integracao externa.
  const occurrence = new Occurrence({
    ...req.body,
    createdBy: (req.user && req.user.username) || req.body.createdBy,
  });
  occurrence.validateForCreate();

  const backendResponse = await callBackend("occurrences.create", {
    auth: backendAuth(req),
    occurrence: occurrence.toPayload(),
  });

  const externalIntegration = await sendOccurrenceToExternalApi(backendResponse.data);
  const status = externalIntegration.success ? 201 : 207;

  return res.status(status).json({
    message: externalIntegration.success
      ? "Ocorrencia criada com sucesso"
      : "Ocorrencia criada com sucesso, mas a integracao externa falhou",
    data: backendResponse.data,
    externalIntegration,
  });
});

exports.updateOccurrence = asyncHandler(async (req, res) => {
  const occurrence = new Occurrence({ ...req.body, id: req.params.id });

  const backendResponse = await callBackend("occurrences.update", {
    auth: backendAuth(req),
    id: req.params.id,
    occurrence: occurrence.toPayload(),
  });

  return ok(res, {
    message: "Ocorrencia atualizada com sucesso",
    data: backendResponse.data,
  });
});

exports.deleteOccurrence = asyncHandler(async (req, res) => {
  await callBackend("occurrences.delete", {
    auth: backendAuth(req),
    id: req.params.id,
  });

  return noContent(res);
});
