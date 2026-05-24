const asyncHandler = require("../util/asyncHandler");
const { callBackend } = require("../util/pythonBridge");
const { ok } = require("../util/http");
const { requireFields, sanitizeString } = require("../util/validation");
const { signToken } = require("../middlewares/auth");

exports.login = asyncHandler(async (req, res) => {
  const payload = {
    username: sanitizeString(req.body.username || req.body.email || req.body.nome, 120),
    password: req.body.password || req.body.senha,
  };

  requireFields(payload, ["username", "password"]);

  const backendResponse = await callBackend("auth.login", payload);
  const user = backendResponse.data.user;
  const token = signToken(user);

  return ok(res, {
    message: "Login realizado com sucesso",
    token,
    user,
  });
});
