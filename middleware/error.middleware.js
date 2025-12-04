import mongoose from 'mongoose';

export const errorHandler = (err, req, res, next) => {
  // Log error internally (not exposed to client)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Mongoose connection error
  if (err.name === 'MongoServerError' || err.name === 'MongooseError' || err.message?.includes('buffering timed out')) {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable. Please try again later.'
    });
  }

  // Mongoose not connected error
  if (err.message?.includes('Not connected') || err.message?.includes('Connection is not established')) {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable. Please try again later.'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid input data. Please check your request and try again.'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'This record already exists.'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please login again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Session expired. Please login again.'
    });
  }

  // Default error - never expose internal details
  res.status(err.status || 500).json({
    success: false,
    error: 'An error occurred. Please try again later.'
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'The requested resource was not found.'
  });
};

