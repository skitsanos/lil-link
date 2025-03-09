import {withAuth} from '@/middleware/authMiddleware.ts';

const handler = async (_req: Request) =>
{
    return Response.json({
        name: 'my-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
};

export default withAuth(handler);