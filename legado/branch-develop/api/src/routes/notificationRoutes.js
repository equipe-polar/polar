const express = require("express");
const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);
router.post("/", notificationController.createNotification);

module.exports = router;
