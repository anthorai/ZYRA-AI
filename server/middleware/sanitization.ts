import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// HTML sanitization function
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous HTML tags and attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .replace(/javascript:/gi, '')
    .trim();
}

// SQL injection prevention - escapes special characters
export function sanitizeSql(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

// General text sanitization
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 10000); // Limit length
}

// Email validation and sanitization
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .slice(0, 255);
}

// URL sanitization
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Only allow http(s) protocols
  if (!url.match(/^https?:\/\//i)) {
    return '';
  }
  
  return url.trim().slice(0, 2048);
}

// Middleware to sanitize request body
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      
      if (typeof value === 'string') {
        // Apply general sanitization
        req.body[key] = sanitizeText(value);
        
        // Special handling for known fields
        if (key.toLowerCase().includes('email')) {
          req.body[key] = sanitizeEmail(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
          req.body[key] = sanitizeUrl(value);
        } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
          req.body[key] = sanitizeHtml(value);
        }
      }
    });
  }
  next();
};

// Validation rules for common inputs
export const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Product name must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
];

export const validateCampaign = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Campaign name required'),
  body('type').isIn(['email', 'sms']).withMessage('Type must be email or sms'),
  body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content required'),
  body('subject').optional().trim().isLength({ max: 200 }).withMessage('Subject too long'),
];

export const validateUser = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
];

// Middleware to check validation results
export const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(err => ({
        field: 'field' in err ? err.field : 'unknown',
        message: err.msg
      }))
    });
  }
  next();
};
