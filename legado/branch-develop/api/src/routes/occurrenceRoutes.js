const express = require("express");
const occurrenceController = require("../controllers/occurrenceController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", occurrenceController.listOccurrences);
router.get("/:id", occurrenceController.getOccurrenceById);
router.post("/", occurrenceController.createOccurrence);
router.put("/:id", occurrenceController.updateOccurrence);
router.delete("/:id", occurrenceController.deleteOccurrence);

module.exports = router;
