// routes/api/auth/signup/post.ts
import {aql, Database} from 'arangojs';
import {randomBytes} from 'crypto';
// Using Bun's native bcrypt implementation
import {password} from 'bun';

import {z} from 'zod';

// Define Zod schema for signup request validation
const SignupSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().optional(),
    lastName: z.string().optional()
});

// Extract TypeScript type from the schema
type SignupRequestBody = z.infer<typeof SignupSchema>;

/**
 * Signup handler for creating new user accounts
 */
export default async (req: Request): Promise<Response> =>
{
    // Set up CORS headers for preflight requests
    if (req.method === 'OPTIONS')
    {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400' // 24 hours
            }
        });
    }

    try
    {
        // Parse request body
        const rawBody = await req.json();

        // Validate request body using Zod
        const validationResult = SignupSchema.safeParse(rawBody);

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

        // Ensure the users collection exists
        try
        {
            await usersCollection.exists();
        }
        catch (error)
        {
            await db.createCollection('users');
        }

        // Check if user already exists
        const cursor = await db.query(aql`
        FOR user IN ${usersCollection}
        FILTER user.email == ${body.email.toLowerCase()}
        RETURN user
        `);

        const existingUser = await cursor.next();

        if (existingUser)
        {
            return Response.json(
                {
                    success: false,
                    message: 'A user with this email already exists'
                },
                {status: 409}
            );
        }

        // Generate verification token
        const verificationToken = randomBytes(48).toString('hex');

        // Hash the password using Bun's native bcrypt implementation
        const hashedPassword = await password.hash(body.password, {
            algorithm: 'bcrypt',
            cost: 10 // Equivalent to saltRounds in the bcrypt package
        });

        // Create new user document
        const user = {
            email: body.email.toLowerCase(),
            passwordHash: hashedPassword,
            firstName: body.firstName || '',
            lastName: body.lastName || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            verified: false,
            verificationToken: verificationToken,
            active: true
        };

        // Save user to database
        const result = await usersCollection.save(user);

        // TODO: Send verification email
        // This would typically be implemented with an email service
        console.log(`Verification token for ${body.email}: ${verificationToken}`);

        // Return success response (excluding sensitive information)
        return Response.json(
            {
                success: true,
                message: 'User registered successfully',
                user: {
                    _id: result._id,
                    _key: result._key,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt,
                    verified: user.verified
                }
            },
            {status: 201}
        );
    }
    catch (error: any)
    {
        console.error('Signup error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to create user account',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};