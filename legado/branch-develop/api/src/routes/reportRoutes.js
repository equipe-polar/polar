const express = require("express");
const reportController = require("../controllers/reportController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/occurrences", reportController.getOccurrenceReport);
router.get("/student/:id", reportController.getStudentReport);

module.exports = router;
