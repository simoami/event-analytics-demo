FROM node:12-alpine

# Install Python, Global Yarn dependencies
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python curl && \
  yarn global add pm2
# apk del native-deps

# Prepare workspace
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-production}
ARG HOST
ENV HOST ${HOST:-0.0.0.0}
ARG PORT
ENV PORT ${PORT:-8080}
ARG REDIS_HOST
ENV REDIS_PORT ${REDIS_PORT:-6371}
ARG REDIS_PASSWORD
ENV REDIS_PASSWORD ${REDIS_PASSWORD}

# Downstream dependency install

COPY . /usr/src/app
RUN chown -R node:node /usr/src/app/
USER node
RUN yarn install --production=false
RUN yarn build

# Expose ports needed to use Keymetrics.io
EXPOSE 80 8080 3000  443 43554

#CMD ["node", "server/server.js"]
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
