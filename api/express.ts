import 'dotenv/config.js';
import express, { NextFunction, RequestHandler, Response } from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import Constants from './constants/Constants';
import { keycloakInit, middleware as protect } from './keycloak/index';
import openRouter from './routes/open/index';
import protectedRouter from './routes/protected/index';

const app: express.Application = express();
keycloakInit(app);

const { HOSTNAME, API_PORT, TESTING, BACKEND_URL } = Constants;

// Swagger Configuration
const swaggerURL = HOSTNAME.includes('localhost') ? `${HOSTNAME}:${API_PORT}/api` : `${BACKEND_URL}/api`;
const OPENAPI_OPTIONS = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Staff Purchase Reimbursement (SPR) API',
      version: '1.0.0',
      description: 'Documentation for the SPR API.',
    },
    servers: [{ url: swaggerURL }],
  },
  apis: ['./docs/*.yaml'],
};

// Express Rate Limiter Configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// CORS Configuration
// Localhost does not need to be specified.
// TODO: Add origin for frontend when available
const corsOptions = {
  origin: [
    'https://submit.digital.gov.bc.ca',
  ]
}

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev')); // logging middleware
app.use(cors(corsOptions));
if (!TESTING) app.use(limiter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(OPENAPI_OPTIONS)));

// Routing Open Routes
app.use('/api', openRouter.chefsRouter);
app.use('/api', openRouter.healthRouter);

// Routing Protected Routes
// Pass the request through with no protection (for testing)
const falseProtect: unknown = (req: Request, res: Response, next : NextFunction) => { console.warn('Keycloak is off'); next(); }
// Allow for removed protection when API testing is enabled, otherwise use Keycloak
const routeProtector : (RequestHandler | Promise<Response<any, Record<string, any>>>) = `${process.env.TESTING}`.toLowerCase() === 'true' ? (falseProtect as RequestHandler) : protect;
app.use('/api', routeProtector, protectedRouter.requests);


export default app;
