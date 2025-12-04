import mongoose from 'mongoose';

/**
 * Check if MongoDB is connected and ready
 * @returns {boolean} True if connected, false otherwise
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

/**
 * Get MongoDB connection status
 * @returns {string} Connection status
 */
export const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Check if an error is a database connection error
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a connection error
 */
export const isDbConnectionError = (error) => {
  if (!error) return false;
  
  // First check if DB is not connected
  if (!isDbConnected()) {
    return true;
  }
  
  const errorMessage = (error.message || '').toLowerCase();
  const errorName = (error.name || '').toLowerCase();
  const errorString = String(error).toLowerCase();
  
  // Check for various MongoDB/Mongoose connection errors
  const connectionErrorPatterns = [
    'buffering timed out',
    'not connected',
    'connection is not established',
    'topology was destroyed',
    'server selection timed out',
    'connection timed out',
    'failed to connect',
    'cannot connect',
    'network error',
    'socket hang up',
    'econnrefused',
    'enotfound',
    'etimedout',
    'mongoservererror',
    'mongooseerror',
    'mongonetworkerror',
    'mongotimeouterror'
  ];
  
  return (
    connectionErrorPatterns.some(pattern => 
      errorMessage.includes(pattern) || 
      errorString.includes(pattern) ||
      errorName.includes(pattern)
    ) ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT' ||
    error.codeName === 'TopologyDestroyed' ||
    error.codeName === 'ServerSelectionTimeout'
  );
};

/**
 * Handle database errors in controllers
 * @param {Error} error - The error to handle
 * @param {Response} res - Express response object
 * @param {string} defaultMessage - Default error message
 * @returns {Response|void} Response if it's a connection error, void otherwise
 */
export const handleDbError = (error, res, defaultMessage = 'Database operation failed') => {
  if (isDbConnectionError(error)) {
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable. Please try again later.'
    });
  }
  return null; // Let the controller handle the error
};

