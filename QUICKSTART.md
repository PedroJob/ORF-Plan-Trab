# 🚀 Guia de Inicialização Rápida - sisptrab

Este guia mostra como colocar o sistema no ar em poucos minutos.

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- ✅ Node.js 18 ou superior
- ✅ PostgreSQL 14 ou superior
- ✅ npm ou yarn

## ⚡ Inicialização em 5 Passos

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar Banco de Dados

Crie um banco PostgreSQL chamado `sisptrab`:

```bash
# No PostgreSQL
createdb sisptrab

# Ou via psql
psql -U postgres
CREATE DATABASE sisptrab;
\q
```

### 3️⃣ Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sisptrab?schema=public"
JWT_SECRET="sua-chave-secreta-aqui-mude-em-producao"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Importante:** Substitua `usuario` e `senha` pelas credenciais do seu PostgreSQL.

### 4️⃣ Criar Tabelas e Popular Banco

Execute as migrações e o seed em um único comando:

```bash
npm run db:migrate
npm run db:seed
```

Isso vai criar todas as tabelas e popular com dados de exemplo.

### 5️⃣ Iniciar o Servidor

```bash
npm run dev
```

Pronto! Acesse: **http://localhost:3000**

## 🔐 Credenciais de Teste

Após executar o seed, você pode fazer login com:

### Super Administrador

- **Email:** admin@eb.mil.br
- **Senha:** admin123

### Comandante CMA

- **Email:** cmt.cma@eb.mil.br
- **Senha:** senha123

### Comandante Brigada

- **Email:** cmt.brigada@eb.mil.br
- **Senha:** senha123

### Comandante OM (6º BEC)

- **Email:** cmt.bec@eb.mil.br
- **Senha:** senha123

### Integrante OM

- **Email:** integrante@eb.mil.br
- **Senha:** senha123

## 🎯 Testando o Sistema

### 1. Fazer Login

Acesse http://localhost:3000/login e faça login com qualquer uma das credenciais acima.

### 2. Explorar Dashboard

Veja as estatísticas e operações criadas.

### 3. Criar um Plano de Trabalho

1. Vá em "Operações"
2. Clique na Operação CATRIMANI II (já criada pelo seed)
3. Clique em "Novo Plano de Trabalho"
4. Preencha os dados
5. Adicione itens financeiros

### 4. Testar Workflow de Aprovações

1. Como Integrante OM, crie um plano e envie para análise
2. Faça logout
3. Faça login como Comandante OM
4. Aprove ou reprove o plano
5. Veja o histórico de aprovações

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev                  # Iniciar servidor dev
npm run build                # Build para produção
npm start                    # Iniciar produção

# Banco de Dados
npm run db:migrate           # Criar/aplicar migrações
npm run db:seed              # Popular banco com dados
npm run db:studio            # Abrir Prisma Studio (GUI)
npm run db:reset             # Resetar banco (CUIDADO!)

# Outros
npm run lint                 # Verificar código
```

## 🔍 Prisma Studio (Visualizar Banco)

Para visualizar e editar dados do banco através de uma interface gráfica:

```bash
npm run db:studio
```

Acesse: http://localhost:5555

## ❗ Problemas Comuns

### Erro: "Can't reach database server"

**Causa:** PostgreSQL não está rodando ou credenciais erradas no `.env`

**Solução:**

```bash
# Verificar se PostgreSQL está rodando
brew services list | grep postgresql  # macOS
systemctl status postgresql           # Linux

# Testar conexão
psql -U seu_usuario -d sisptrab
```

### Erro: "P3009: migrate.lock is missing"

**Solução:**

```bash
rm -rf prisma/migrations
npm run db:migrate
```

### Erro de portas em uso

**Solução:**

```bash
# Mudar porta no package.json ou matar processo
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

### Erro: "Module not found: Can't resolve..."

**Solução:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Próximos Passos

1. ✅ Explore o código em `src/`
2. ✅ Leia a [documentação completa](README.md)
3. ✅ Customize para suas necessidades
4. ✅ Adicione novas funcionalidades

## 💡 Dicas

- Use o Prisma Studio (`npm run db:studio`) para visualizar dados
- Teste com diferentes roles para entender permissões
- Veja os logs no terminal para debug
- Use o navegador em modo anônimo para testar múltiplos usuários

## 🆘 Precisa de Ajuda?

- Verifique o [README.md](README.md) completo
- Consulte a documentação do [Next.js](https://nextjs.org/docs)
- Consulte a documentação do [Prisma](https://www.prisma.io/docs)

---

**Desenvolvido para o Exército Brasileiro** 🇧🇷
