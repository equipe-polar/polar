function created(res, body) {
  return res.status(201).json(body);
}

function ok(res, body) {
  return res.status(200).json(body);
}

function noContent(res) {
  return res.status(204).send();
}

module.exports = {
  created,
  noContent,
  ok,
};
