const express = require("express");

const authRoutes = require("./authRoutes");
const notificationRoutes = require("./notificationRoutes");
const occurrenceRoutes = require("./occurrenceRoutes");
const reportRoutes = require("./reportRoutes");
const studentRoutes = require("./studentRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/occurrences", occurrenceRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
