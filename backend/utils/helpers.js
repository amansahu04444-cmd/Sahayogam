/**
 * API Response Helper
 */

/**
 * Send success response
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 */
export const sendError = (res, message, statusCode = 500, errors = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

/**
 * API Info
 */
export const apiInfo = {
  name: 'Smart Resource Allocation System API',
  version: '1.0.0',
  description: 'Data-Driven Volunteer Coordination for NGOs',
};
