// routes/api/url/anonymous/get.ts
import {aql, Database} from 'arangojs';
import corsResponse from '@/middleware/corsResponse';
import getIpAddress from '@/utils/getIpAddress';

/**
 * Get URLs created by anonymous users (identified by IP address)
 */
export default async (req: Request): Promise<Response> =>
{
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS')
    {
        return corsResponse();
    }

    try
    {
        // Get user's IP address
        const ipAddress = getIpAddress(req);

        // Parse query parameters
        const url = new URL(req.url);
        const slug = url.searchParams.get('slug');

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

        // If slug is provided, look up specific URL
        if (slug)
        {
            const cursor = await db.query(aql`
                FOR url IN ${urlsCollection}
                FILTER url.slug == ${slug} AND url.ipAddress == ${ipAddress} AND url.userId == null
                RETURN url
            `);

            const urlDoc = await cursor.next();

            if (!urlDoc)
            {
                return Response.json(
                    {
                        success: false,
                        message: 'URL not found or you do not have permission to view it'
                    },
                    {status: 404}
                );
            }

            // Construct the short URL
            const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
            const shortUrl = `${baseUrl}/${urlDoc.slug}`;

            // Return the URL info
            return Response.json({
                success: true,
                data: {
                    ...urlDoc,
                    shortUrl
                }
            });
        }
        // Otherwise, return recent URLs created by this IP
        else
        {
            // Limit to most recent 5 URLs created by this IP
            const cursor = await db.query(aql`
                FOR url IN ${urlsCollection}
                FILTER url.ipAddress == ${ipAddress} AND url.userId == null
                SORT url.createdAt DESC
                LIMIT 5
                RETURN url
            `);

            const urls = await cursor.all();

            // Construct the base URL for the shortened links
            const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

            // Add shortUrl to each URL object
            const urlsWithShortUrl = urls.map(url => ({
                ...url,
                shortUrl: `${baseUrl}/${url.slug}`
            }));

            // Return the URLs
            return Response.json({
                success: true,
                data: {
                    urls: urlsWithShortUrl
                }
            });
        }
    }
    catch (error: any)
    {
        console.error('Anonymous URL info error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to retrieve URL information',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};