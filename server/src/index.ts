// auth-server.js
import {serve} from 'bun';
import {loadRoutes} from '@/utils/loadRoutes.ts';
// Start the server
serve({
    port: process.env.PORT || 3000,
    development: process.env.NODE_ENV !== 'production',

//     if(req.method === 'OPTIONS'){
//     return new Response(null, {
//         headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type, Authorization'
//         }
//     });
// }

    // Load all route handlers dynamically
    routes: await loadRoutes('routes')
});

console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);