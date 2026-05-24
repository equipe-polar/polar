const User = require("../model/User");
const asyncHandler = require("../util/asyncHandler");
const { backendAuth } = require("../middlewares/auth");
const { callBackend } = require("../util/pythonBridge");
const { created, ok } = require("../util/http");

exports.listUsers = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("users.list", {
    auth: backendAuth(req),
  });

  return ok(res, {
    message: "Usuarios listados com sucesso",
    data: backendResponse.data,
  });
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = new User(req.body);
  user.validateForCreate();

  const backendResponse = await callBackend("users.create", {
    auth: backendAuth(req),
    user: user.toPayload(),
  });

  return created(res, {
    message: "Usuario criado com sucesso",
    data: backendResponse.data,
  });
});
