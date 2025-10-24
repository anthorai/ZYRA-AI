import express from "express";
import { registerRoutes } from "../server/routes";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Enable compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://checkout.razorpay.com",
        "https://www.paypal.com",
        "https://www.sandbox.paypal.com"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://api.openai.com",
        "https://api.razorpay.com",
        "https://www.paypal.com",
        "https://www.sandbox.paypal.com"
      ],
      frameSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://www.paypal.com",
        "https://www.sandbox.paypal.com"
      ],
      fontSrc: [
        "'self'", 
        "data:",
        "https://fonts.gstatic.com"
      ],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOrigin = process.env.VERCEL_URL 
  ? [`https://${process.env.VERCEL_URL}`, process.env.PRODUCTION_DOMAIN].filter((origin): origin is string => Boolean(origin))
  : true;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register routes
registerRoutes(app);

// Export for Vercel serverless
export default app;
