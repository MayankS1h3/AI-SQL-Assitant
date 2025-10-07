# 🚀 Quick Start Guide - AI SQL Assistant Backend

Get up and running in 5 minutes!

## ⚡ Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- A Supabase project for testing

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install
```

## 🔧 Step 2: Set Up Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

### Required Variables:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-sql-assistant

# Generate with: openssl rand -base64 32
JWT_SECRET=your-generated-secret-here

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-generated-key-here

# Your OpenAI API key
OPENAI_API_KEY=sk-your-key-here
```

### Generate Secure Keys:

```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Step 3: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Paste into `.env` as `MONGODB_URI`

## 🔌 Step 4: Set Up Your Supabase Database

1. Open your Supabase project
2. Go to SQL Editor
3. Copy contents of `supabase-setup.sql`
4. Paste and run in SQL Editor
5. Verify functions were created successfully

## ▶️ Step 5: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# You should see:
# ✅ MongoDB Connected
# 🚀 AI SQL Assistant Backend Server
# Port: 5000
```

## 🧪 Step 6: Test the API

### Test Health Endpoint

```bash
curl http://localhost:5000/health
```

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response!

### Add a Database Connection

```bash
curl -X POST http://localhost:5000/api/connections/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "nickname": "My Test DB",
    "supabaseUrl": "https://xxxxx.supabase.co",
    "supabaseAnonKey": "your-anon-key"
  }'
```

### Query with Natural Language

```bash
curl -X POST http://localhost:5000/api/query/generate-sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "connectionId": "YOUR_CONNECTION_ID",
    "naturalLanguageQuery": "Show me all users"
  }'
```

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Can register a new user
- [ ] Can login and receive JWT token
- [ ] Can add a database connection
- [ ] Can generate and execute SQL queries
- [ ] OpenAI API calls work

## 🐛 Common Issues

### MongoDB Connection Failed

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Fix:**
- Verify your `MONGODB_URI` is correct
- For Atlas: Whitelist your IP address in Network Access
- Check username and password are correct

### OpenAI API Errors

**Error:** `Invalid API key`

**Fix:**
- Verify `OPENAI_API_KEY` in `.env`
- Check key format starts with `sk-`
- Ensure you have credits/billing set up

### Supabase Connection Failed

**Error:** `Failed to connect to database`

**Fix:**
- Verify Supabase URL format: `https://xxxxx.supabase.co`
- Check anon key is correct (from Settings > API)
- Ensure you ran the SQL setup file (step 4)
- Make sure RPC functions exist: `SELECT * FROM get_tables();`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Fix:**
```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001
```

## 📚 Next Steps

1. **Run Tests:** `npm test`
2. **Read Full Documentation:** Check `README.md`
3. **Set Up Frontend:** Move to `/frontend` directory
4. **Deploy:** Follow AWS deployment guide in README

## 🆘 Need Help?

- Check logs in terminal for detailed errors
- Review `README.md` for full documentation
- Verify all environment variables are set correctly
- Ensure MongoDB and OpenAI services are accessible

## 🎉 Success!

If you can execute a natural language query and get results, you're all set! The backend is working perfectly.

Now you can:
- Add more database connections
- Query your databases with natural language
- View query history
- Build the frontend to create a full-featured web app

---

**Happy coding! 🚀**
