FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers (already in the image, but ensuring chromium is ready)
RUN npx playwright install chromium

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
