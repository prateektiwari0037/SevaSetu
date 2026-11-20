export const successResponse = (res, message = 'Success', data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta && typeof meta === 'object') {
    Object.assign(response, meta);
  }
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
