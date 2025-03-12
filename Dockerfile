# use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY server/package.json /temp/dev/
# Check if lockfile exists and copy the correct one
COPY server/bun.lockb server/bun.lock* /temp/dev/ 2>/dev/null || true
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY server/package.json /temp/prod/
COPY server/bun.lockb server/bun.lock* /temp/prod/ 2>/dev/null || true
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules server/node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/server/src ./src
COPY --from=prerelease /usr/src/app/server/public ./public
COPY --from=prerelease /usr/src/app/server/tsconfig.json .
COPY --from=prerelease /usr/src/app/server/package.json .

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]