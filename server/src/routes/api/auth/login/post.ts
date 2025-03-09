// routes/api/auth/login/post.ts
import {aql, Database} from 'arangojs';
import {z} from 'zod';
import {password} from 'bun';
import jwt from 'jsonwebtoken';
import corsResponse from '@/middleware/corsResponse.ts';

// Define Zod schema for login request validation
const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

// Extract TypeScript type from the schema
type LoginRequestBody = z.infer<typeof LoginSchema>;

/**
 * Login handler that authenticates users and issues JWT tokens
 */
export default async (req: Request): Promise<Response> =>
{
    // Set up CORS headers for preflight requests
    if (req.method === 'OPTIONS')
    {
        return corsResponse();
    }

    try
    {
        // Parse and validate request body
        const rawBody = await req.json();
        const validationResult = LoginSchema.safeParse(rawBody);

        if (!validationResult.success)
        {
            // Extract and format validation errors from Zod
            const errors = validationResult.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            return Response.json(
                {
                    success: false,
                    message: 'Validation failed',
                    errors: errors
                },
                {status: 400}
            );
        }

        // Use the validated and typed data
        const body = validationResult.data;

        // Connect to ArangoDB
        const dbConfig = {
            url: process.env.ARANGO_URL || 'http://localhost:8529',
            databaseName: process.env.ARANGO_DB || 'auth_db',
            auth: {
                username: process.env.ARANGO_USERNAME || 'root',
                password: process.env.ARANGO_PASSWORD || ''
            }
        };

        const db = new Database(dbConfig);
        const usersCollection = db.collection('users');

        // Retrieve user by email
        const cursor = await db.query(aql`
      FOR user IN ${usersCollection}
      FILTER user.email == ${body.email.toLowerCase()}
      RETURN user
    `);

        const user = await cursor.next();

        // User not found
        if (!user)
        {
            return Response.json(
                {
                    success: false,
                    message: 'Invalid email or password'
                },
                {status: 401}
            );
        }

        // Check if user account is active
        if (!user.active)
        {
            return Response.json(
                {
                    success: false,
                    message: 'Account is disabled. Please contact support.'
                },
                {status: 403}
            );
        }

        // Verify password
        const isPasswordValid = await password.verify(body.password, user.passwordHash);

        if (!isPasswordValid)
        {
            return Response.json(
                {
                    success: false,
                    message: 'Invalid email or password'
                },
                {status: 401}
            );
        }

        // Generate JWT token
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

        // Create token payload
        const tokenPayload = {
            sub: user._key, // Subject (user ID)
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            verified: user.verified,
            iat: Math.floor(Date.now() / 1000), // Issued at (current time)
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Expires in 24 hours
        };

        // Sign the JWT token
        const token = jwt.sign(tokenPayload, jwtSecret);

        // Update last login timestamp in database
        await db.query(aql`
      UPDATE ${user._key} WITH { 
        lastLoginAt: ${new Date().toISOString()},
        updatedAt: ${new Date().toISOString()}
      } IN ${usersCollection}
    `);

        // Return success response with token
        return Response.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                _id: user._id,
                _key: user._key,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                verified: user.verified
            }
        });
    }
    catch (error: any)
    {
        console.error('Login error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Authentication failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};