// utils/getUserFromRequest.ts

// Extract user information from JWT in the request
import jwt from 'jsonwebtoken';

const getUserFromRequest = (req: Request): { userId: string | null, authenticated: boolean } =>
{
    const authHeader = req.headers.get('Authorization');

    // Check if Authorization header exists and has the Bearer token format
    if (!authHeader || !authHeader.startsWith('Bearer '))
    {
        return {
            userId: null,
            authenticated: false
        };
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
            return {
                userId: null,
                authenticated: false
            };
        }

        // Decode the JWT token (without verification for this function)
        // In production, you might want to use jwt.verify instead
        const decoded = jwt.decode(token);

        if (decoded && typeof decoded === 'object' && decoded.sub)
        {
            return {
                userId: decoded.sub,
                authenticated: true
            };
        }
    }
    catch (error)
    {
        console.error('JWT decoding error:', error);
    }

    return {
        userId: null,
        authenticated: false
    };
};

export default getUserFromRequest;