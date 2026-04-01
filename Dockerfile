
FROM node:20-alpine As production

RUN apk add \
   chromium \
   nss \
   freetype \
   harfbuzz \
   ca-certificates \
   ttf-freefont 

RUN mkdir ./dist
RUN mkdir ./template

COPY --chown=node:node /package.json ./package.json
COPY --chown=node:node /yarn.lock ./yarn.lock
COPY --chown=node:node /dist ./dist
COPY --chown=node:node /template ./template

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV production
RUN yarn install --production

EXPOSE 3000
ENV PORT 3000
# Start the server using the production build
CMD [ "node", "dist/main.js" ]
