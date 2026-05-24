const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "polar-development-secret";
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username || user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: "polar-api",
    }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token JWT ausente." });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret(), { issuer: "polar-api" });
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token JWT invalido ou expirado." });
  }
}

function requireRole(...roles) {
  const allowed = roles.map((role) => role.toUpperCase());

  return function roleMiddleware(req, res, next) {
    const role = String(req.user && req.user.role ? req.user.role : "").toUpperCase();
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Perfil sem permissao para esta operacao." });
    }
    return next();
  };
}

function backendAuth(req) {
  return {
    id: req.user && req.user.id,
    username: req.user && req.user.username,
    email: req.user && req.user.email,
    role: req.user && req.user.role,
  };
}

module.exports = {
  backendAuth,
  requireAuth,
  requireRole,
  signToken,
};
