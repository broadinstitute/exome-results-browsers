FROM node:12.18.1-alpine

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app

USER node

ENV NODE_ENV=production

# Install dependencies
COPY --chown=node:node package.json .
COPY --chown=node:node src/browsers/package.json src/browsers/package.json
COPY --chown=node:node yarn.lock .
RUN yarn install --production false --frozen-lockfile && yarn cache clean

# Copy frontend source
COPY --chown=node:node babel.config.js .
COPY --chown=node:node src/browsers ./src/browsers

# Build frontend
COPY build.env .
RUN export $(cat build.env | xargs); \
  for BROWSER in ASC BipEx Epi25 SCHEMA; do \
    BROWSER=$BROWSER yarn run webpack --config=./src/browsers/webpack.config.js; \
  done

###############################################################################
FROM node:12.18.1-alpine

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
COPY --chown=node:node --from=0 /home/node/app/src/server/public ./public

# Copy server source
COPY --chown=node:node src/server .

# Run
CMD ["node", "server.js"]
