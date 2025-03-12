# Client build stage with Node.js
FROM node:20-alpine AS client-builder
WORKDIR /usr/src/app
# Copy client source
COPY client/ ./client/
# Install client dependencies and build
RUN cd client && npm install && npm run build

# Server stages with Bun
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install server dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY server/package.json /temp/dev/
RUN cd /temp/dev && bun install

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY server/package.json /temp/prod/
RUN cd /temp/prod && bun install --production

# Copy node_modules and server code
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules server/node_modules
COPY . .
# Create public directory if it doesn't exist
RUN mkdir -p server/public
# Copy built client assets into server/public
COPY --from=client-builder /usr/src/app/client/dist/ server/public/

# Final release image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/server/src ./src
COPY --from=prerelease /usr/src/app/server/public ./public
COPY --from=prerelease /usr/src/app/server/tsconfig.json .
COPY --from=prerelease /usr/src/app/server/package.json .

# Run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]