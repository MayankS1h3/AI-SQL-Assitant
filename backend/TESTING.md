# 🧪 API Testing Guide

## Option 1: REST Client (VS Code Extension) - RECOMMENDED ✨

### Install
```bash
code --install-extension humao.rest-client
```

### Usage
1. Open `api-tests.http` in VS Code
2. Click **"Send Request"** above any request
3. Results appear in a split pane
4. After login, copy token and paste in `@token` variable at top

**Benefits:**
- ✅ No external apps needed
- ✅ Version controlled test files
- ✅ Fast and lightweight
- ✅ Variables for easy token management

---

## Option 2: Postman

### Import Collection

Create a new collection with these requests or import from the `api-tests.http` file.

### Environment Variables
Set these in Postman environment:
- `baseUrl`: `http://localhost:5000`
- `token`: (set after login)

---

## Option 3: Thunder Client (VS Code Extension)

### Install
```bash
code --install-extension rangav.vscode-thunder-client
```

Similar to Postman but built into VS Code.

---

## Option 4: cURL Commands

For quick terminal testing:

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
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

### Get User Info (replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Add Connection (replace TOKEN and credentials)
```bash
curl -X POST http://localhost:5000/api/connections/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "nickname": "My Database",
    "supabaseUrl": "https://xxxxx.supabase.co",
    "supabaseAnonKey": "your-key"
  }'
```

### Generate SQL Query (replace TOKEN and IDs)
```bash
curl -X POST http://localhost:5000/api/query/generate-sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "connectionId": "YOUR_CONNECTION_ID",
    "naturalLanguageQuery": "Show me all users"
  }'
```

---

## 🎯 Recommended Testing Workflow

### 1. Basic Auth Flow
- [ ] Health check
- [ ] Register user
- [ ] Login (save token)
- [ ] Get user info with token

### 2. Connection Management
- [ ] Add a database connection (use test Supabase project)
- [ ] List all connections
- [ ] Get specific connection
- [ ] Update connection nickname
- [ ] (Don't delete yet, need it for queries)

### 3. Query Operations
- [ ] Prepare schema for a connection
- [ ] Generate SQL from natural language
- [ ] Execute raw SQL query

### 4. History
- [ ] View query history
- [ ] Filter by connection
- [ ] Get specific query details
- [ ] Delete a query
- [ ] Clear all history

### 5. Cleanup
- [ ] Delete test connection
- [ ] Verify deletion

---

## 🐛 Expected Responses

### Success Response Example
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

---

## 🔍 Common Issues

### 401 Unauthorized
- Token expired or invalid
- Token not included in Authorization header
- Format must be: `Bearer <token>`

### 400 Bad Request
- Invalid request body
- Missing required fields
- Validation errors

### 404 Not Found
- Resource doesn't exist
- Wrong endpoint URL
- Wrong connection/query ID

### 500 Server Error
- Check server logs
- MongoDB connection issue
- OpenAI API error

---

## 💡 Pro Tips

1. **Use Variables**: Define `@baseUrl` and `@token` once in REST Client
2. **Save Tokens**: Keep your login token handy during testing
3. **Test Incrementally**: Test each endpoint before moving to the next
4. **Check Logs**: Watch server console for detailed error messages
5. **Use Real Data**: Test with actual Supabase project for best results

---

## 🎓 Next Steps After Testing

Once all endpoints work:
1. ✅ Commit working backend to Git
2. ✅ Start building the React frontend
3. ✅ Integrate frontend with tested API
4. ✅ Deploy to production

Happy Testing! 🚀
