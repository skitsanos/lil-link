// routes/api/url/$urlId/put.ts
import {aql, Database} from 'arangojs';
import {z} from 'zod';
import corsResponse from '@/middleware/corsResponse';
import getUserFromRequest from '@/utils/getUserFromRequest';
import {withAuth} from '@/middleware/authMiddleware';

// Schema for URL update request
const UpdateUrlSchema = z.object({
    // New slug (optional)
    customSlug: z.string()
                 .max(50, 'Custom slug must be 50 characters or less')
                 .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, underscores and hyphens are allowed')
                 .optional(),

    // New expiration (optional)
    expiresAt: z.string().optional().nullable()
                .refine(val =>
                {
                    if (!val)
                    {
                        return true;
                    }
                    const date = new Date(val);
                    return !isNaN(date.getTime());
                }, {
                    message: 'Invalid date format'
                })
});

/**
 * Update URL endpoint for authenticated users
 */
const handler = async (req: Request): Promise<Response> =>
{
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS')
    {
        return corsResponse();
    }

    try
    {
        // Get URL ID from path
        // @ts-ignore
        const { urlId } = req.params as { urlId: string };

        // Get user ID from authenticated request
        const {userId} = getUserFromRequest(req);

        // Parse and validate request body
        const rawBody = await req.json();
        const validationResult = UpdateUrlSchema.safeParse(rawBody);

        if (!validationResult.success)
        {
            // Extract and format validation errors
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
        const urlsCollection = db.collection('urls');

        // First, check if the URL exists and belongs to the user
        const checkCursor = await db.query(aql`
            FOR url IN ${urlsCollection}
            FILTER url._key == ${urlId} AND url.userId == ${userId}
            RETURN url
        `);

        const existingUrl = await checkCursor.next();

        console.log(userId, urlId);
        console.log(existingUrl);

        if (!existingUrl)
        {
            return Response.json(
                {
                    success: false,
                    message: 'URL not found or you do not have permission to modify it'
                },
                {status: 404}
            );
        }

        // Prepare update data
        const updateData = {};
        let newSlug = existingUrl.slug;

        // Process slug update if provided
        if (body.customSlug !== undefined && body.customSlug !== existingUrl.slug)
        {
            // Check if the new slug is already taken
            const slugCursor = await db.query(aql`
                FOR url IN ${urlsCollection}
                FILTER url.slug == ${body.customSlug} AND url._key != ${urlId}
                RETURN url
            `);

            if (slugCursor.hasNext)
            {
                return Response.json(
                    {
                        success: false,
                        message: 'This custom slug is already taken. Please choose another one.'
                    },
                    {status: 409}
                );
            }

            Object.assign(updateData, {
                slug: body.customSlug,
                isCustomSlug: true
            });
        }

        // Process expiration update if provided
        if (body.expiresAt !== undefined)
        {
            Object.assign(updateData, {
                expiresAt: body.expiresAt
            });
        }

        // Update timestamp
        Object.assign(updateData, {
            updatedAt: new Date().toISOString()
        });

        // Update URL in database
        await db.query(aql`
            UPDATE ${urlId} 
            WITH ${updateData} 
            IN ${urlsCollection}
        `);

        // Get the updated URL
        const updatedCursor = await db.query(aql`
            FOR url IN ${urlsCollection}
            FILTER url._key == ${urlId}
            RETURN url
        `);

        const updatedUrl = await updatedCursor.next();

        // Construct the short URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const shortUrl = `${baseUrl}/${updatedUrl.slug}`;

        // Return success response
        return Response.json({
            success: true,
            message: 'URL updated successfully',
            data: {
                ...updatedUrl,
                shortUrl
            }
        });
    }
    catch (error: any)
    {
        console.error('URL update error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to update URL',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};

export default withAuth(handler);