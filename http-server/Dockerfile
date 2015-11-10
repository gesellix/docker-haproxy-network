FROM node:4
MAINTAINER Tobias Gesellchen <tobias@gesellix.de> @gesellix

WORKDIR /project
COPY ./package.json /project/package.json
COPY ./index.html /project/index.html
RUN npm install

CMD ["npm", "start"]
