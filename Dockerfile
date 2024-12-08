FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files if you have them (if not, we'll handle that later)
COPY package*.json ./

# Install dependencies if you have a package.json
# If you don't yet, you can skip this step for now
RUN npm install

# Copy the rest of your application
COPY . .

# Expose port 3000 inside the container
EXPOSE 3000

# Set the default command to run your app (we'll define the start script later)
CMD [ "npm", "start" ]
