// routes/api/dashboard/stats/get.ts
import {aql, Database} from 'arangojs';
import corsResponse from '@/middleware/corsResponse';
import getUserFromRequest from '@/utils/getUserFromRequest';
import {withAuth} from '@/middleware/authMiddleware';

/**
 * Get dashboard statistics for the authenticated user
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

        // Get the base URL for constructing short URLs
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

        // Get current date and date 7 days ago, 30 days ago
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(now.getDate() - 60);

        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(now.getDate() + 7);

        // Format dates for AQL queries
        const nowIso = now.toISOString();
        const sevenDaysAgoIso = sevenDaysAgo.toISOString();
        const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();
        const sixtyDaysAgoIso = sixtyDaysAgo.toISOString();
        const sevenDaysFromNowIso = sevenDaysFromNow.toISOString();

        // Query for dashboard statistics
        const cursor = await db.query(aql`
            // Card 1: User's URL Activity Summary
            LET activeUrls = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.expiresAt == null OR url.expiresAt > ${nowIso}
                RETURN url
            )
            
            LET totalActiveUrls = LENGTH(activeUrls)
            LET totalClicks = SUM(FOR url IN activeUrls RETURN url.clicks)
            LET avgClicksPerUrl = totalClicks / COUNT(activeUrls)
            
            // Card 2: Performance Trends
            LET mostPopularUrl = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                SORT url.clicks DESC
                LIMIT 1
                RETURN {
                    _key: url._key,
                    slug: url.slug,
                    longUrl: url.longUrl,
                    clicks: url.clicks,
                    shortUrl: CONCAT(${baseUrl}, "/", url.slug)
                }
            )[0]
            
            LET recentClicks = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.lastClickedAt != null AND url.lastClickedAt >= ${sevenDaysAgoIso}
                RETURN url.clicks
            )
            
            LET previousPeriodClicks = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.lastClickedAt != null 
                AND url.lastClickedAt >= ${sevenDaysAgoIso} 
                AND url.lastClickedAt < ${nowIso}
                RETURN url.clicks
            )
            
            LET newestUrl = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                SORT url.createdAt DESC
                LIMIT 1
                RETURN {
                    _key: url._key,
                    slug: url.slug,
                    longUrl: url.longUrl,
                    createdAt: url.createdAt,
                    shortUrl: CONCAT(${baseUrl}, "/", url.slug)
                }
            )[0]
            
            // Card 3: Usage Status
            LET customUrls = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.isCustomSlug == true
                RETURN url
            )
            
            LET totalUrls = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                RETURN url
            )
            
            LET customUrlsCount = LENGTH(customUrls)
            LET totalUrlsCount = LENGTH(totalUrls)
            LET customUrlsPercentage = totalUrlsCount > 0 ? (customUrlsCount / totalUrlsCount) * 100 : 0
            
            LET expiringUrls = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.expiresAt != null AND url.expiresAt <= ${sevenDaysFromNowIso} AND url.expiresAt > ${nowIso}
                RETURN url
            )
            
            LET urlsThisMonth = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.createdAt >= ${thirtyDaysAgoIso}
                RETURN url
            )
            
            LET urlsPreviousMonth = (
                FOR url IN ${urlsCollection}
                FILTER url.userId == ${userId}
                FILTER url.createdAt >= ${sixtyDaysAgoIso} AND url.createdAt < ${thirtyDaysAgoIso}
                RETURN url
            )
            
            LET urlCreationRate = {
                current: LENGTH(urlsThisMonth),
                previous: LENGTH(urlsPreviousMonth),
                trend: LENGTH(urlsThisMonth) - LENGTH(urlsPreviousMonth)
            }
            
            // Return all stats
            RETURN {
                urlActivitySummary: {
                    totalActiveUrls,
                    totalClicks: totalClicks || 0,
                    avgClicksPerUrl: avgClicksPerUrl || 0
                },
                performanceTrends: {
                    mostPopularUrl,
                    recentActivity: {
                        clicksLast7Days: SUM(recentClicks) || 0,
                        previousPeriodClicks: SUM(previousPeriodClicks) || 0,
                        change: SUM(previousPeriodClicks) > 0 
                            ? ((SUM(recentClicks) - SUM(previousPeriodClicks)) / SUM(previousPeriodClicks)) * 100 
                            : 0
                    },
                    newestUrl
                },
                usageStatus: {
                    customUrls: {
                        count: customUrlsCount,
                        percentage: customUrlsPercentage,
                        total: totalUrlsCount
                    },
                    expiringUrls: LENGTH(expiringUrls),
                    urlCreationRate
                }
            }
        `);

        const stats = await cursor.next();

        // Return statistics
        return Response.json({
            success: true,
            data: stats
        });
    }
    catch (error: any)
    {
        console.error('Dashboard stats error:', error);

        // Return error response
        return Response.json(
            {
                success: false,
                message: 'Failed to retrieve dashboard statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            {status: 500}
        );
    }
};

export default withAuth(handler);