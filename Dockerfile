# base image
FROM node:18-slim

# working directory
WORKDIR /usr/src/app

# copy package and install
COPY package.json package-lock.json* ./
RUN npm install --production

# copy rest of source
COPY . .

# install needed tools and cloudflared
RUN apt-get update && apt-get install -y curl ca-certificates \
    && curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared \
    && rm -rf /var/lib/apt/lists/*

# make entrypoint executable
RUN chmod +x /usr/src/app/entrypoint.sh

# expose port
EXPOSE 3000

# entrypoint runs both app and tunnel
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
