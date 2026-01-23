/**
 * Sanitization Middleware
 * Protects against XSS and NoSQL Injection by cleaning input data
 */

const sanitize = (val) => {
    if (typeof val === 'string') {
        // Remove null characters
        val = val.replace(/\0/g, '');

        // Basic XSS Protection: Remove dangerous tags and similar payloads
        val = val
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
            .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, "")
            .replace(/<embed\b[^>]*>([\s\S]*?)<\/embed>/gim, "")
            .replace(/<link\b[^>]*>/gim, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
            .replace(/on\w+="[^"]*"/gim, "")
            .replace(/on\w+='[^']*'/gim, "")
            .replace(/on\w+=\w+/gim, "")
            .replace(/javascript:/gim, "");

        // Prevent NoSQL Injection by escaping $ and . at the start of keys (though express-mongo-sanitize is better)
        return val;
    }

    if (Array.isArray(val)) {
        return val.map(sanitize);
    }

    if (typeof val === 'object' && val !== null) {
        const sanitizedObj = {};
        for (const key in val) {
            // Prevent mongo injection by stripping keys starting with $ or containing .
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }
            sanitizedObj[key] = sanitize(val[key]);
        }
        return sanitizedObj;
    }

    return val;
};

export const sanitizationMiddleware = (req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};

export const preventDangerousChars = (req, res, next) => {
    // Strict check for extremely dangerous characters in specific fields if needed
    // For now, global sanitization is usually enough.
    next();
};
