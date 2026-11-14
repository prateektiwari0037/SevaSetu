import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return errorResponse(res, `A record with this ${target} already exists.`, 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return errorResponse(res, 'Requested resource not found.', 404);
  }

  // Multer error
  if (err.name === 'MulterError') {
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
};
