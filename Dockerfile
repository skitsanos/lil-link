# use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY server/package.json /temp/dev/
# Install without requiring the lockfile
RUN cd /temp/dev && bun install

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY server/package.json /temp/prod/
RUN cd /temp/prod && bun install --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules server/node_modules
COPY . .

# Debug to see what's in the build context
RUN ls -la server/
RUN ls -la server/ || true

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/server/src ./src
# Try a different approach for the public folder
COPY --from=prerelease /usr/src/app/server/public ./public
COPY --from=prerelease /usr/src/app/server/tsconfig.json .
COPY --from=prerelease /usr/src/app/server/package.json .

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]