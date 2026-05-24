function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number(error.status || error.statusCode || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;

  const response = {
    message: safeStatus >= 500 ? "Erro interno da API." : error.message,
    error: {
      code: error.code || "API_ERROR",
    },
  };

  if (process.env.NODE_ENV !== "production") {
    response.error.details = error.backend || error.details || undefined;
  }

  return res.status(safeStatus).json(response);
}

module.exports = errorHandler;
