// utils/loadRoutes.js
import {existsSync, mkdirSync, readdirSync} from 'fs';
import {basename, dirname, join} from 'path';
import {fileURLToPath} from 'url';
import * as React from 'react';
import {renderToReadableStream} from 'react-dom/server';

/**
 * Check if a module exports a React component
 * @param {any} module - The imported module to check
 * @returns {boolean} - Whether the module exports a React component
 */
function isReactComponent(module: any): boolean
{
    if (!module || !module.default)
    {
        return false;
    }

    // Check if it's a React element factory (function)
    if (typeof module.default === 'function')
    {
        // Check for known React component patterns
        // 1. Class components extend React.Component
        if (module.default.prototype && module.default.prototype.isReactComponent)
        {
            return true;
        }

        // 2. Function components return JSX
        // This is harder to detect, but we can check the function name and content
        const fnStr = module.default.toString();
        return fnStr.includes('React.createElement') ||
            fnStr.includes('jsx') ||
            fnStr.includes('_jsx');
    }

    // 3. Direct JSX elements (less common in modules)
    return React.isValidElement(module.default);
}

/**
 * Create a handler for a React component
 * @param {any} Component - The React component
 * @returns {Function} - A handler function for the component
 */
function createReactHandler(Component: any): Function
{
    return async (req: Request) =>
    {
        try
        {
            // Render the React component to a stream
            const stream = await renderToReadableStream(
                React.createElement(Component, {request: req})
            );

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/html'
                }
            });
        }
        catch (error: any)
        {
            console.error('Error rendering React component:', error);
            return new Response(`Error: ${error.message}`, {status: 500});
        }
    };
}

/**
 * Recursively scans directories to build route paths
 * @param {string} rootDir - Base routes directory
 * @param {Object} routes - Routes object being built
 * @returns {Object} - Updated routes object
 */
async function scanDirectoryForRoutes(rootDir: string, routes: { [key: string]: any } = {})
{
    // Read all directories recursively
    const allDirs = readdirSync(rootDir, {
        withFileTypes: true,
        recursive: true
    }).filter(entry => entry.isDirectory());

    // Process each directory and build path
    for (const dir of allDirs)
    {
        const relativePath = dir.path.replace(rootDir, '');
        const fullDirPath = join(dir.path, dir.name);

        // Build the route path
        let routePath = join(relativePath, dir.name)
            .split('/')
            .filter(Boolean) // Remove empty segments
            .map(segment => segment.startsWith('$') ? `:${segment.substring(1)}` : segment)
            .join('/');

        routePath = '/' + routePath;

        // Find handler files in this directory
        const files = readdirSync(fullDirPath, {withFileTypes: true})
            .filter(file => file.isFile())
            .filter(file => /\.(js|ts|jsx|tsx)$/.test(file.name));

        if (files.length > 0)
        {
            // Initialize handlers for this route
            const methodHandlers = {} as { [key: string]: Function };

            // Process each handler file
            for (const file of files)
            {
                // Get method from filename (excluding extension)
                const method = basename(file.name).replace(/\..+/i, '').toUpperCase();
                const filePath = join(fullDirPath, file.name);

                // Dynamically import the file
                try
                {
                    // Convert to a relative path for import
                    const importPath = '/' + filePath.split('/').slice(1).join('/');
                    const module = await import(importPath);

                    // Handle special 'INDEX' case
                    if (method === 'INDEX')
                    {
                        if (isReactComponent(module))
                        {
                            // If it's a React component, create a handler for it
                            methodHandlers['GET'] = createReactHandler(module.default);
                            console.log(`Loaded React component for GET ${routePath}`);
                        }
                        else
                        {
                            // Otherwise treat it as a normal GET handler
                            methodHandlers['GET'] = module.default;
                            console.log(`Loaded regular handler for GET ${routePath}`);
                        }
                    }
                    else if ([
                        'GET',
                        'POST',
                        'PUT',
                        'DELETE',
                        'PATCH',
                        'OPTIONS',
                        'HEAD',
                        'WS'
                    ].includes(method))
                    {
                        // Regular HTTP method
                        methodHandlers[method] = module.default;
                        console.log(`Loaded ${method} ${routePath}`);
                    }
                    else
                    {
                        console.warn(`Invalid HTTP method in file: ${file.name}`);
                    }
                }
                catch (error)
                {
                    console.error(`Error loading handler from ${filePath}:`, error);
                }
            }

            // Only add routes with handlers
            if (Object.keys(methodHandlers).length > 0)
            {
                routes[routePath] = methodHandlers;
            }
        }
    }

    // Also process root level files
    const rootFiles = readdirSync(rootDir, {withFileTypes: true})
        .filter(file => file.isFile())
        .filter(file => /\.(js|ts|jsx|tsx)$/.test(file.name));

    if (rootFiles.length > 0)
    {
        const methodHandlers = {} as { [key: string]: Function };

        for (const file of rootFiles)
        {
            const method = basename(file.name).replace(/\..+/i, '').toUpperCase();
            const filePath = join(rootDir, file.name);

            try
            {
                const importPath = '/' + filePath.split('/').slice(1).join('/');
                const module = await import(importPath);

                if (method === 'INDEX')
                {
                    if (isReactComponent(module))
                    {
                        methodHandlers['GET'] = createReactHandler(module.default);
                    }
                    else
                    {
                        methodHandlers['GET'] = module.default;
                    }
                }
                else if ([
                    'GET',
                    'POST',
                    'PUT',
                    'DELETE',
                    'PATCH',
                    'OPTIONS',
                    'HEAD',
                    'WS'
                ].includes(method))
                {
                    methodHandlers[method] = module.default;
                }
                else
                {
                    console.warn(`Invalid HTTP method in file: ${file.name}`);
                }
            }
            catch (error)
            {
                console.error(`Error loading handler from ${filePath}:`, error);
            }
        }

        if (Object.keys(methodHandlers).length > 0)
        {
            routes['/'] = methodHandlers;
        }
    }

    return routes;
}

/**
 * Dynamically loads route handlers from the specified directory
 * @param {string} routesDir - Relative path to the routes directory
 * @returns {Object} - Object mapping routes to their handlers
 */
export async function loadRoutes(routesDir: string)
{
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const routesPath = join(currentDir, '..', routesDir);
    console.log(`Loading routes from ${routesPath}`);

    //if  routesDir does not exist, create it
    if (!existsSync(routesPath))
    {
        console.log(`Creating routes directory at ${routesPath}`);
        mkdirSync(routesPath, {recursive: true});
    }

    // Scan directory recursively for routes
    let routes = await scanDirectoryForRoutes(routesPath);


    // Add a default route if no routes were found
    if (Object.keys(routes).length === 0)
    {
        routes['/'] = {
            'GET': async (_req: Request) =>
            {
                return new Response('It works', {
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                });
            }
        };
        console.log('No routes found, added default route');
    }

    console.log(`Total routes loaded: ${Object.keys(routes).length}`);
    return routes;
}