const Notification = require("../model/Notification");
const asyncHandler = require("../util/asyncHandler");
const { backendAuth } = require("../middlewares/auth");
const { callBackend } = require("../util/pythonBridge");
const { created } = require("../util/http");

exports.createNotification = asyncHandler(async (req, res) => {
  const notification = new Notification(req.body);
  notification.validateForCreate();

  const backendResponse = await callBackend("notifications.create", {
    auth: backendAuth(req),
    notification: notification.toPayload(),
  });

  return created(res, {
    message: "Notificacao registrada com sucesso",
    data: backendResponse.data,
  });
});
