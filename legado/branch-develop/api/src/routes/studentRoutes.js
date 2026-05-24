const express = require("express");
const studentController = require("../controllers/studentController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", studentController.listStudents);
router.get("/:id", studentController.getStudentById);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
