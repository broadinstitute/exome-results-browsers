FROM --platform=linux/amd64 node:16.13.1-bullseye-slim AS build

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

USER node

ENV NODE_ENV=production

# Install dependencies
COPY --chown=node:node src/browsers/package.json src/browsers/package.json
COPY --chown=node:node src/server/package.json src/server/package.json
COPY --chown=node:node package.json .
COPY --chown=node:node yarn.lock .
COPY --chown=node:node tsconfig.json .
RUN yarn install --production false --frozen-lockfile && yarn cache clean

# Copy frontend source, build it
COPY --chown=node:node babel.config.js .
COPY --chown=node:node src/browsers ./src/browsers
COPY --chown=node:node build.env .
RUN set -a && . ./build.env && set +a && yarn run build

# Copy server source, transpile TS to JS
COPY --chown=node:node src/server ./src/server
RUN npx tsc

###############################################################################
FROM --platform=linux/amd64 node:16.13.1-bullseye-slim

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

USER node

ENV NODE_ENV=production
ENV PORT=8000

# Install dependencies
COPY --chown=node:node src/server/package.json .
COPY --chown=node:node yarn.lock .
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy frontend from build stage
COPY --chown=node:node --from=build /home/node/app/src/server/public ./public

# Copy the JS backend from build stage
COPY --chown=node:node --from=build /home/node/app/dist/server ./

# Copy build environment variables
COPY --chown=node:node build.env .

# Run
CMD ["/bin/sh", "-c", "export $(grep -v '^#' build.env | xargs) && exec node server.js"]
