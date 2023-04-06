FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies with yarn
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build the application for production
RUN yarn build

# Expose the port that the application will run on
EXPOSE 3000

# Start the application
CMD [ "yarn", "start" ]