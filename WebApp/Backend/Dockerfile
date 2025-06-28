### Usage: 
# Build: $ docker build --no-cache -t ecotel_backend:latest .
# Run: $ docker run -d -p 8888:8888 ecotel_backend:latest

FROM node:18

## Create app directory
WORKDIR /usr/src/app

## Install app dependencies
## A wildcard is used to ensure both package.json AND package-lock.json are 
## copied where available (npm@5+)
COPY package*.json ./

# Clean & Install dependencies
RUN npm ci 

## Bundle app source
COPY . .

## Production port
EXPOSE 8080

## Development port 
#EXPOSE 8888
#CMD [ "npm", "run", "start:staging" ]
# Start the application with multiple commands
# CMD ["sh", "-c", "npm run migrate && npm run seed:all && npm run start:staging"]

# Copy entrypoint script and give execute permissions
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Use entrypoint script to handle migrations & app startup
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]