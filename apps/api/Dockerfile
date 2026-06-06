FROM node:18-alpine

WORKDIR /usr/app/ptag

COPY package.json .

RUN npm install

COPY . .

EXPOSE 5432

CMD ["npm", "prisma", "generate"]

CMD ["npm", "run", "dev"]
