// routes/api/url/post.ts
import {aql, Database} from 'arangojs';
import {randomBytes} from 'crypto';
import {CreateUrlSchema} from '@/schemas/UrlSchema';
import corsResponse from '@/middleware/corsResponse';
import getUserFromRequest from '@/utils/getUserFromRequest';
import getIpAddress from '@/utils/getIpAddress';
import type {AqlLiteral, GeneratedAqlQuery} from 'arangojs/aql';
import type {ArangoCollection} from 'arangojs/collections';
import type {Graph} from 'arangojs/graphs';
import type {View} from 'arangojs/views';

// Configuration for slug generation
const SLUG_LENGTH = 6;
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_RETRIES = 5;

/**
 * Generate a random slug of specified length
 */
function generateSlug(length = SLUG_LENGTH): string
{
    const bytes = randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++)
    {
        result += SLUG_CHARS.charAt(bytes[i] % SLUG_CHARS.length);
    }

    return result;
}

/**
 * Batch-check for unique slugs to reduce database calls
 * @param db Database connection
 * @param urlsCollection URL collection
 * @param attemptCount Number of attempts so far (used for increasing length)
 * @returns A unique slug
 */
async function generateUniqueSlug(db: Database, urlsCollection: string | number | boolean | any[] | Record<string, any> | ArangoCollection | View | Graph | GeneratedAqlQuery<any> | AqlLiteral | null | undefined, attemptCount = 0)
{
    // Generate multiple slugs at once to check in batch
    const batchSize = 5;
    const currentLength = SLUG_LENGTH + Math.floor(attemptCount / MAX_RETRIES);
    const slugCandidates = Array.from({length: batchSize}, () => generateSlug(currentLength));

    // Check all generated slugs in a single query
    const cursor = await db.query(aql`
        LET slugs = ${slugCandidates}
        FOR url IN ${urlsCollection}
        FILTER url.slug IN slugs
        RETURN url.slug
    `);

    // Get existing slugs
    const existingSlugs = await cursor.all();

    // Find the first slug that doesn't exist
    const uniqueSlug = slugCandidates.find(slug => !existingSlugs.includes(slug));

    if (uniqueSlug)
    {
        return uniqueSlug;
    }

    // If all slugs in the batch exist, try again with increased attempt count
    return generateUniqueSlug(db, urlsCollection, attemptCount + 1);
}

/**
 * Create shortened URL endpoint
 * Works for both anonymous and authenticated users
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
        // Parse and validate request body
        const rawBody = await req.json();
        const validationResult = CreateUrlSchema.safeParse(rawBody);

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

        // Get user info (authenticated or anonymous)
        const {
            userId,
            authenticated
        } = getUserFromRequest(req);

        const ipAddress = getIpAddress(req);

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

        // Ensure the urls collection exists
        try
        {
            await urlsCollection.exists();
        }
        catch (error)
        {
            await db.createCollection('urls');
        }

        // Determine slug (custom or generated)
        let slug = body.customSlug?.trim();
        const isCustomSlug = !!slug;

        // If custom slug provided, check if it's already taken
        if (isCustomSlug)
        {
            const cursor = await db.query(aql`
                FOR url IN ${urlsCollection}
                FILTER url.slug == ${slug}
                RETURN url
            `);

            const existingUrl = await cursor.next();

            if (existingUrl)
            {
                return Response.json(
                    {
                        success: false,
                        message: 'This custom slug is already taken. Please choose another one.'
                    },
                    {status: 409}
                );
            }
        }
        else
        {
            // Generate a unique slug
            let isUnique = false;
            while (!isUnique)
            {
                slug = await generateUniqueSlug(db, urlsCollection);

                const cursor = await db.query(aql`
                    FOR url IN ${urlsCollection}
                    FILTER url.slug == ${slug}
                    RETURN url
                `);

                isUnique = !(cursor.hasNext);
            }
        }

        // Create URL document
        const urlDoc = {
            slug,
            longUrl: body.longUrl,
            createdAt: new Date().toISOString(),
            expiresAt: body.expiresAt || null,
            userId: userId,
            clicks: 0,
            isCustomSlug,
            ipAddress: authenticated ? null : ipAddress
        };

        // Save URL to database
        const result = await urlsCollection.save(urlDoc);

        // Construct the short URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const shortUrl = `${baseUrl}/${slug}`;

        // Return success response
        return Response.json(
            {
                success: true,
                message: 'URL shortened successfully',
                data: {
                    _id: result._id,
                    _key: result._key,
                    shortUrl,
                    slug,
                    longUrl: urlDoc.longUrl,
                    createdAt: urlDoc.createdAt,
                    expiresAt: urlDoc.expiresAt,
                    isCustomSlug
                }
            },
            {status: 201}
        );
    }
    catch (error: any)
    {
        console.error('URL shortening error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to create shortened URL',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};