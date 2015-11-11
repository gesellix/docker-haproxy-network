FROM node:4
MAINTAINER Tobias Gesellchen <tobias@gesellix.de> @gesellix

WORKDIR /project
COPY ./package.json /project/package.json
RUN npm install
COPY ./index.html /project/index.html

CMD ["npm", "start"]
