# AI SQL Assistant - Backend

A secure, multi-tenant MERN-stack backend API that enables users to connect to their Supabase (PostgreSQL) databases and query them using natural language powered by OpenAI GPT-4.

## 🚀 Features

- **🔐 JWT Authentication** - Secure user registration and login with bcrypt password hashing
- **🔒 Encrypted Credential Storage** - AES-256-CBC encryption for Supabase keys
- **🤖 AI-Powered SQL Generation** - Natural language to SQL using OpenAI GPT-4
- **📊 Multi-Database Support** - Users can connect and query multiple Supabase databases
- **⚡ Schema Caching** - In-memory caching with TTL for faster query generation
- **📝 Query History** - Automatic logging of all queries with execution metrics
- **🛡️ SQL Safety Validation** - Only SELECT queries allowed, prevents data modification
- **🎯 Prioritized Schema Context** - Smart schema formatting for optimal AI context

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- OpenAI API key
- Supabase project(s) for testing

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` with your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (Atlas or local)
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/ai-sql-assistant

# JWT Configuration
JWT_SECRET=<run: openssl rand -base64 32>
JWT_EXPIRES_IN=7d

# Encryption Key (32 bytes hex)
ENCRYPTION_KEY=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Schema Cache (seconds)
SCHEMA_CACHE_TTL=600

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Generate Secure Keys

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🎯 Supabase Setup

Your users will need to create PostgreSQL functions in their Supabase databases to enable schema introspection and SQL execution.

### Required PostgreSQL Functions

Run this SQL in your Supabase SQL Editor:

```sql
-- Function to execute arbitrary SQL (SELECT only recommended)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN result;
END;
$$;

-- Function to get all tables
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;

-- Function to get all columns
CREATE OR REPLACE FUNCTION get_columns()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    table_name::text,
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
$$;

-- Function to get foreign keys
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
$$;

-- Function to get constraints
CREATE OR REPLACE FUNCTION get_constraints()
RETURNS TABLE (
  table_name text,
  constraint_name text,
  constraint_type text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    table_name::text,
    constraint_name::text,
    constraint_type::text
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
  ORDER BY table_name, constraint_type;
$$;
```

**⚠️ Security Note:** The `execute_sql` function uses `SECURITY DEFINER` which runs with the permissions of the function creator. Only allow SELECT operations in production.

## 🚦 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Run Tests

```bash
npm test

# Watch mode
npm run test:watch
```

## 📡 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Database Connections

#### Add Connection
```http
POST /api/connections/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "Production DB",
  "supabaseUrl": "https://xxxxx.supabase.co",
  "supabaseAnonKey": "your-anon-key",
  "supabaseServiceRoleKey": "your-service-role-key"  // Optional
}
```

#### Get All Connections
```http
GET /api/connections
Authorization: Bearer <token>
```

#### Update Connection
```http
PUT /api/connections/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "Updated Name"
}
```

#### Delete Connection
```http
DELETE /api/connections/:id
Authorization: Bearer <token>
```

### Query Operations

#### Prepare Schema (Cache it)
```http
POST /api/query/prepare-schema
Authorization: Bearer <token>
Content-Type: application/json

{
  "connectionId": "connection-id-here"
}
```

#### Generate and Execute SQL
```http
POST /api/query/generate-sql
Authorization: Bearer <token>
Content-Type: application/json

{
  "connectionId": "connection-id-here",
  "naturalLanguageQuery": "Show me all users who signed up last month"
}
```

#### Execute Raw SQL (Advanced)
```http
POST /api/query/execute-sql
Authorization: Bearer <token>
Content-Type: application/json

{
  "connectionId": "connection-id-here",
  "sql": "SELECT * FROM users LIMIT 10"
}
```

### Query History

#### Get History
```http
GET /api/history?page=1&limit=50&connectionId=xxx&status=success
Authorization: Bearer <token>
```

#### Get Specific Query
```http
GET /api/history/:id
Authorization: Bearer <token>
```

#### Delete Query
```http
DELETE /api/history/:id
Authorization: Bearer <token>
```

#### Clear All History
```http
DELETE /api/history
Authorization: Bearer <token>
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User model with connections
│   │   └── QueryHistory.js       # Query history model
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication middleware
│   │   └── errorHandler.js       # Global error handler
│   ├── utils/
│   │   ├── encryption.js         # AES encryption utilities
│   │   ├── cache.js              # In-memory cache with TTL
│   │   ├── supabaseClient.js     # Supabase client creation
│   │   └── schemaFetcher.js      # Database schema utilities
│   ├── services/
│   │   ├── aiService.js          # OpenAI GPT-4 integration
│   │   └── queryService.js       # Query generation & execution
│   ├── controllers/
│   │   ├── authController.js     # Auth endpoints
│   │   ├── connectionController.js  # Connection management
│   │   ├── queryController.js    # Query operations
│   │   └── historyController.js  # History operations
│   ├── routes/
│   │   ├── auth.js
│   │   ├── connections.js
│   │   ├── query.js
│   │   └── history.js
│   └── server.js                 # Main application entry
├── __tests__/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── package.json
├── .env.example
└── README.md
```

## 🔐 Security Features

1. **Password Hashing** - bcrypt with salt rounds of 10
2. **Credential Encryption** - AES-256-CBC for Supabase keys
3. **JWT Tokens** - Secure session management
4. **SQL Injection Prevention** - Only SELECT queries allowed
5. **Input Validation** - express-validator for all inputs
6. **CORS Protection** - Configurable origin whitelist

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 🚀 Deployment (AWS)

### Option 1: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create ai-sql-backend-env

# Deploy
eb deploy
```

### Option 2: AWS EC2

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Node.js and MongoDB
3. Clone repository
4. Set environment variables
5. Install PM2: `npm install -g pm2`
6. Start: `pm2 start src/server.js --name ai-sql-backend`

### Option 3: AWS Lambda + API Gateway

Use the Serverless Framework for Lambda deployment.

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 7d |
| `ENCRYPTION_KEY` | 32-byte hex key for encryption | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `OPENAI_MODEL` | OpenAI model to use | No | gpt-4-turbo-preview |
| `SCHEMA_CACHE_TTL` | Schema cache TTL in seconds | No | 600 |
| `CORS_ORIGIN` | Allowed CORS origin | No | http://localhost:5173 |

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string format
- For Atlas: whitelist your IP address

### OpenAI API Errors
- Verify API key is valid
- Check billing/quota limits
- Ensure model name is correct

### Supabase Connection Fails
- Verify URL format: `https://xxxxx.supabase.co`
- Check that anon key is correct
- Ensure PostgreSQL functions are created (see Supabase Setup)

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🔗 Related

- Frontend Repository: [Link to frontend repo]
- Documentation: [Link to full docs]

---

**Built with ❤️ using Node.js, Express, MongoDB, and OpenAI GPT-4**
