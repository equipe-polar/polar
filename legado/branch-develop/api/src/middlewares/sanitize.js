const { sanitizeObject } = require("../util/validation");

function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }

  next();
}

module.exports = sanitizeRequest;
