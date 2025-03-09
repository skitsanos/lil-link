// utils/getIpAddress.ts

// Get user IP address from request
const getIpAddress = (req: Request): string =>
{
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor)
    {
        return forwardedFor.split(',')[0].trim();
    }
    return '0.0.0.0'; // Fallback
};

export default getIpAddress;
