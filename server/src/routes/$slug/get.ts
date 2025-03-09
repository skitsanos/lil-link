// routes/$slug/get.ts
import {aql, Database} from 'arangojs';

/**
 * Handles redirection for shortened URLs
 * This file is named get.ts and placed in a directory named $slug
 * to handle paths like yourdomain.com/abcdef
 */
export default async (req: Request): Promise<Response> =>
{
    try
    {
        // Extract slug from URL path
        const url = new URL(req.url);
        const slug = url.pathname.substring(1); // Remove leading slash

        // Skip API paths and other special paths
        if (slug.startsWith('api/') ||
            slug === 'favicon.ico' ||
            slug === 'robots.txt' ||
            slug === '')
        {
            // Not a slug, pass to next handler
            return new Response('Not found', {status: 404});
        }

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

        // Look up the slug in the database
        const cursor = await db.query(aql`
            FOR url IN ${urlsCollection}
            FILTER url.slug == ${slug}
            RETURN url
        `);

        const urlDoc = await cursor.next();

        // If URL not found, return 404
        if (!urlDoc)
        {
            return new Response('URL not found', {status: 404});
        }

        // Check if URL has expired
        if (urlDoc.expiresAt)
        {
            const expirationDate = new Date(urlDoc.expiresAt);
            if (expirationDate < new Date())
            {
                return new Response('This shortened URL has expired', {status: 410}); // Gone
            }
        }

        // Update click count and last clicked timestamp
        await db.query(aql`
            UPDATE ${urlDoc._key} WITH { 
                clicks: ${urlDoc.clicks + 1},
                lastClickedAt: ${new Date().toISOString()}
            } IN ${urlsCollection}
        `);

        // Redirect to the original URL
        return new Response(null, {
            status: 302, // Found/Temporary redirect
            headers: {
                'Location': urlDoc.longUrl,
                'Cache-Control': 'no-cache'
            }
        });
    }
    catch (error: any)
    {
        console.error('URL redirect error:', error);

        // Return error response
        return new Response('Server error', {status: 500});
    }
};