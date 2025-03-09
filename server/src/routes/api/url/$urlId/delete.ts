// routes/api/url/$urlId/delete.ts
import { aql, Database } from 'arangojs';
import corsResponse from '@/middleware/corsResponse';
import getUserFromRequest from '@/utils/getUserFromRequest';
import { withAuth } from '@/middleware/authMiddleware';

/**
 * Delete URL endpoint for authenticated users
 */
const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return corsResponse();
    }

    try {
        // @ts-ignore
        const { urlId } = req.params as { urlId: string };

        // Get user ID from authenticated request
        const { userId } = getUserFromRequest(req);

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

        if (!existingUrl) {
            return Response.json(
                {
                    success: false,
                    message: 'URL not found or you do not have permission to delete it'
                },
                { status: 404 }
            );
        }

        // Delete the URL
        await urlsCollection.remove(urlId);

        // Return success response
        return Response.json({
            success: true,
            message: 'URL deleted successfully'
        });
    } catch (error: any) {
        console.error('URL delete error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to delete URL',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
};

export default withAuth(handler);