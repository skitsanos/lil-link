// models/UrlSchema.ts
import { z } from 'zod';

/**
 * Schema for validating URL creation requests
 */
export const CreateUrlSchema = z.object({
    // Original URL to shorten
    longUrl: z.string().url('Please enter a valid URL'),

    // Custom slug (optional)
    customSlug: z.string().max(50, 'Custom slug must be 50 characters or less')
                 .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, underscores and hyphens are allowed')
                 .optional(),

    // Custom expiration (optional)
    expiresAt: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, {
        message: 'Invalid date format'
    })
});

/**
 * Schema for URL database model
 */
export const UrlDbSchema = z.object({
    _key: z.string(),                // Database key
    _id: z.string(),                 // Database ID
    slug: z.string(),                // Short URL slug
    longUrl: z.string().url(),       // Original long URL
    createdAt: z.string(),           // Creation timestamp
    expiresAt: z.string().optional(), // Expiration timestamp (optional)
    userId: z.string().optional(),   // User ID for authenticated users (optional)
    clicks: z.number(),              // Number of clicks
    lastClickedAt: z.string().optional(), // Timestamp of last click
    isCustomSlug: z.boolean(),       // Whether the slug was customized
    ipAddress: z.string().optional(), // IP address of creator for anonymous users
});

// Extract TypeScript types from the schemas
export type CreateUrlRequest = z.infer<typeof CreateUrlSchema>;
export type UrlDbModel = z.infer<typeof UrlDbSchema>;