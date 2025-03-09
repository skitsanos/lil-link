// routes/api/url/get.ts
import {aql, Database} from 'arangojs';
import corsResponse from '@/middleware/corsResponse';
import getUserFromRequest from '@/utils/getUserFromRequest.ts';
import {withAuth} from '@/middleware/authMiddleware.ts';

/**
 * Get list of URLs for authenticated user
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
        // Get user ID from authenticated request
        const {
            userId
        } = getUserFromRequest(req);

        // Parse query parameters
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

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

        // Query user's URLs with pagination
        const cursor = await db.query(aql`
            LET userUrls = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                SORT url.createdAt DESC
                LIMIT ${offset}, ${limit}
                RETURN url
            )
            
            LET totalUrls = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                COLLECT WITH COUNT INTO total
                RETURN total
            )[0]
            
            RETURN {
                "urls": userUrls,
                "total": totalUrls
            }
        `);

        const result = await cursor.next();

        // Construct the base URL for the shortened links
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

        // Add shortUrl to each URL object
        const urls = result.urls.map((url: { slug: string; }) => ({
            ...url,
            shortUrl: `${baseUrl}/${url.slug}`
        }));

        // Return successful response
        return Response.json({
            success: true,
            data: {
                urls,
                pagination: {
                    total: result.total,
                    limit,
                    offset,
                    hasMore: offset + urls.length < result.total
                }
            }
        });
    }
    catch (error: any)
    {
        console.error('URL listing error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to retrieve URLs',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};

export default withAuth(handler);