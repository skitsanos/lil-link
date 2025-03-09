// routes/api/url/$urlId/analytics/get.ts
import {aql, Database} from 'arangojs';
import corsResponse from '@/middleware/corsResponse';
import getUserFromRequest from '@/utils/getUserFromRequest';
import {withAuth} from '@/middleware/authMiddleware';

/**
 * Get analytics for a specific URL
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
        // @ts-ignore
        const { urlId } = req.params as { urlId: string };

        // Get user ID from authenticated request
        const {userId} = getUserFromRequest(req);

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

        if (!existingUrl)
        {
            return Response.json(
                {
                    success: false,
                    message: 'URL not found or you do not have permission to view its analytics'
                },
                {status: 404}
            );
        }

        // Calculate basic analytics metrics
        const createdAt = new Date(existingUrl.createdAt);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const averageClicksPerDay = existingUrl.clicks / daysSinceCreation;

        // Construct the short URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const shortUrl = `${baseUrl}/${existingUrl.slug}`;

        // Calculate days remaining if there's an expiration
        let daysRemaining = null;
        if (existingUrl.expiresAt)
        {
            const expiresAt = new Date(existingUrl.expiresAt);
            daysRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }

        // Return analytics data
        return Response.json({
            success: true,
            data: {
                url: {
                    ...existingUrl,
                    shortUrl
                },
                analytics: {
                    totalClicks: existingUrl.clicks,
                    averageClicksPerDay: parseFloat(averageClicksPerDay.toFixed(2)),
                    createdDaysAgo: daysSinceCreation,
                    daysRemaining,
                    lastClickedAt: existingUrl.lastClickedAt || null,
                    clickThroughRate: existingUrl.clicks > 0 ? 100 : 0 // Would need visit tracking for accurate CTR
                }
            }
        });
    }
    catch (error: any)
    {
        console.error('URL analytics error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to retrieve URL analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};

export default withAuth(handler);