const Student = require("../model/Student");
const asyncHandler = require("../util/asyncHandler");
const { backendAuth } = require("../middlewares/auth");
const { callBackend } = require("../util/pythonBridge");
const { created, noContent, ok } = require("../util/http");

exports.listStudents = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("students.list", {
    auth: backendAuth(req),
    query: req.query,
  });

  return ok(res, {
    message: "Alunos listados com sucesso",
    data: backendResponse.data,
  });
});

exports.getStudentById = asyncHandler(async (req, res) => {
  const backendResponse = await callBackend("students.get", {
    auth: backendAuth(req),
    id: req.params.id,
  });

  return ok(res, {
    message: "Aluno carregado com sucesso",
    data: backendResponse.data,
  });
});

exports.createStudent = asyncHandler(async (req, res) => {
  const student = new Student(req.body);
  student.validateForCreate();

  const backendResponse = await callBackend("students.create", {
    auth: backendAuth(req),
    student: student.toPayload(),
  });

  return created(res, {
    message: "Aluno criado com sucesso",
    data: backendResponse.data,
  });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const student = new Student({ ...req.body, id: req.params.id });

  const backendResponse = await callBackend("students.update", {
    auth: backendAuth(req),
    id: req.params.id,
    student: student.toPayload(),
  });

  return ok(res, {
    message: "Aluno atualizado com sucesso",
    data: backendResponse.data,
  });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  await callBackend("students.delete", {
    auth: backendAuth(req),
    id: req.params.id,
  });

  return noContent(res);
});
