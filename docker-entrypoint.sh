#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
sleep 5

echo "🔄 Executando migrations do Prisma..."
npx prisma migrate deploy

echo "✅ Migrations concluídas!"
echo "🚀 Iniciando aplicação..."

exec node server.js
