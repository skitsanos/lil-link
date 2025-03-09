// middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';

/**
 * Interface for the decoded JWT payload
 */
export interface JWTPayload
{
    sub: string;         // User ID
    email: string;       // User email
    name: string;        // User's full name
    verified: boolean;   // Whether the user's email is verified
    iat: number;         // Issued at timestamp
    exp: number;         // Expiration timestamp
}

/**
 * Types for the authentication middleware
 */
export type NextFunction = (req: Request) => Promise<Response>;
export type AuthMiddleware = (req: Request, next: NextFunction) => Promise<Response>;

/**
 * Middleware to verify JWT tokens and attach user information to the request
 *
 * @param req - The incoming request
 * @param next - The next middleware or handler function
 * @returns Response - Either the response from next() or an error response
 */
export const authMiddleware: AuthMiddleware = async (req, next) =>
{
    // Skip JWT verification for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS')
    {
        return next(req);
    }

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');

    // Check if Authorization header exists and has the Bearer token format
    if (!authHeader || !authHeader.startsWith('Bearer '))
    {
        return Response.json(
            {
                success: false,
                message: 'Authorization header missing or invalid'
            },
            {status: 401}
        );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    try
    {
        // Get JWT secret from environment variables
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret)
        {
            console.error('JWT_SECRET environment variable not set');
            return Response.json(
                {
                    success: false,
                    message: 'Internal server error'
                },
                {status: 500}
            );
        }

        // Verify and decode the JWT token
        const payload = jwt.verify(token, jwtSecret) as JWTPayload;

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp < currentTime)
        {
            return Response.json(
                {
                    success: false,
                    message: 'Token expired'
                },
                {status: 401}
            );
        }

        // Continue with the modified request
        return next(req);
    }
    catch (error: any)
    {
        console.error('JWT verification error:', error);

        if (error instanceof jwt.TokenExpiredError)
        {
            return Response.json(
                {
                    success: false,
                    message: 'Token expired'
                },
                {status: 401}
            );
        }

        if (error instanceof jwt.JsonWebTokenError)
        {
            return Response.json(
                {
                    success: false,
                    message: 'Invalid token'
                },
                {status: 401}
            );
        }

        return Response.json(
            {
                success: false,
                message: 'Authentication failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 401}
        );
    }
};

/**
 * Helper function to apply the auth middleware to a route handler
 *
 * @param handler - The route handler function
 * @returns A new handler with authentication applied
 */
export function withAuth(handler: (req: Request) => Promise<Response>)
{
    return async (req: Request): Promise<Response> =>
    {
        return authMiddleware(req, handler);
    };
}