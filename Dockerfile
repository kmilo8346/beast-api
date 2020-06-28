FROM node:alpine AS builder

WORKDIR /home/app

COPY src/ src/
COPY package.json \
    package-lock.json \
    tsconfig.json \
    service-account.json \
    .env \
    .env.example ./

RUN npm install --quiet && \
    npm run build

WORKDIR /home/app/build

COPY package.json \
    package-lock.json \
    service-account.json \
    .env \
    .env.example ./
RUN npm install --production    

FROM node:alpine

# Update System and install Dependencies
RUN apk upgrade --no-cache
RUN apk add --no-cache --update-cache build-base wget curl bash python
RUN apk update

WORKDIR /home/app
COPY --from=builder /home/app/build ./

CMD ["npm", "start"]

