// Middleware to parse JSON from form-data fields
export const parseFormDataJSON = (req, res, next) => {
  // If request has form-data and contains JSON fields, parse them
  if (req.body && typeof req.body === 'object') {
    // Try to parse JSON fields
    Object.keys(req.body).forEach(key => {
      try {
        // If the value looks like JSON, parse it
        if (typeof req.body[key] === 'string' && 
            (req.body[key].startsWith('{') || req.body[key].startsWith('['))) {
          req.body[key] = JSON.parse(req.body[key]);
        }
      } catch (e) {
        // If parsing fails, keep the original value
      }
    });
  }
  next();
};

