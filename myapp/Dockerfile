# Use the official Node.js 18 image
FROM node:18

# Set the working directory in the container
WORKDIR /app/myapp

# Copy the dependencies file to the working directory, install dependencies. Needs to point to the correct directory
COPY myapp/package.json myapp/package-lock.json ./

# install dependencies
RUN npm install

# Ensure ffmpeg-static is correctly installed
RUN apt-get update && apt-get install -y ffmpeg

# Copy the app files to the working directory. Needs to point to the correct directory
COPY myapp/ ./

# Expose default port for the app in the container
EXPOSE 6000

# Command to run the app
CMD ["node", "index.js"]
