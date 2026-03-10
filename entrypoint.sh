#!/bin/sh

# 1. Iniciar cloudflared solicitando una URL aleatoria en segundo plano (&)
cloudflared tunnel --url http://localhost:3000 &

# 2. Iniciar tu aplicación Node.js en primer plano
npm start # (o node index.js, o el comando que uses para levantar tu app)