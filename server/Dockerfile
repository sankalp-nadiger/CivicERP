FROM node:alpine

WORKDIR /server

COPY . .

RUN npm cache clean --force && npm install

EXPOSE 3000


CMD [ "npm", "run", "dev" ]
