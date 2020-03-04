FROM node:12.16.1

ARG BROWSER

ENV BROWSER=${BROWSER}
ENV NODE_ENV=production

WORKDIR /app

# Install dependencies
COPY package.json .
COPY src/client/package.json src/client/package.json
COPY yarn.lock .
COPY gnomadjs ./gnomadjs
RUN yarn install --frozen-lockfile

# Copy source
COPY browsers ./browsers
COPY config ./config
COPY src ./src
COPY babel.config.js .

# Build
RUN yarn run webpack --config=./config/webpack.config.client.js && \
  yarn run webpack --config=./config/webpack.config.server.js

###############################################################################
FROM node:12.16.1

ARG BROWSER

WORKDIR /app

# Install dependencies
COPY src/server/package.json .
COPY yarn.lock .
RUN yarn install --production --frozen-lockfile

# Copy results from build stage
COPY --from=0 /app/dist/${BROWSER} /app/dist

USER node

# Run
CMD ["node", "dist/server.js"]
