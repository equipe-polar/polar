const express = require("express");
const userController = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", requireRole("ADM", "DIRETOR", "COORDENADOR"), userController.listUsers);
router.post("/", requireRole("ADM"), userController.createUser);

module.exports = router;
