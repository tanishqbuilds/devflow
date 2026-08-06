FROM node:22-alpine

WORKDIR /app

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Build the app
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
