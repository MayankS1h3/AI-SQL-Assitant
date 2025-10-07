# **Project Scope & Features: AI SQL Assistant**

Version: 1.0  
Date: October 8, 2025

## **1\. Project Vision & Goals**

To create a secure, multi-tenant, MERN-stack web application that empowers users to connect to their own Supabase (PostgreSQL) databases and interact with them using natural language. The application will leverage a Large Language Model (LLM) to translate user questions into executable SQL queries, run them, and display the results, thereby abstracting away the complexity of writing SQL.

**Core Goals:**

* **Security:** User database credentials must be securely stored and never exposed on the client-side. All interactions must be authenticated.  
* **Usability:** The process of connecting a database and asking questions should be simple and intuitive.  
* **Accuracy:** The system must fetch detailed schema information to provide the AI with the best possible context for generating accurate SQL queries.  
* **Scalability:** The architecture should support many users, each with multiple database connections.

## **2\. Core Features**

### **2.1. User Authentication**

* **F-01: User Registration:** New users can create an account using a username, email, and password.  
* **F-02: User Login:** Registered users can log in to access the application.  
* **F-03: Secure Session Management:** The application will use JSON Web Tokens (JWT) to manage user sessions and protect routes.

### **2.2. Database Connection Management**

* **F-04: Add Multiple Connections:** Authenticated users can save connection details for multiple Supabase projects.  
* **F-05: Secure Credential Storage:** User-provided Supabase URLs and Anon Keys will be encrypted before being stored in the application's database.  
* **F-06: Connection Validation:** The system will test each new database connection to ensure the credentials are valid before saving.  
* **F-07: Manage Connections:** Users can view, update, and delete their saved database connections.

### **2.3. AI-Powered Query Engine**

* **F-08: Database Selection:** Users can select which of their saved databases they want to query from a simple dropdown menu.  
* **F-09: Dynamic Schema Fetching:** Upon selecting a database, the backend will automatically connect and fetch a detailed schema. This includes:  
  * Table names  
  * Column names and their data types  
  * **Foreign key relationships** between tables  
  * **Table constraints** (Primary Keys, Unique, Not Null)  
* **F-10: Natural Language to SQL:** Users can input a question in plain English. The backend will send this question, along with the detailed schema context, to an AI model to generate a SQL query.  
* **F-11: Query Execution & Results:** The backend will execute the AI-generated SQL against the user's selected database and return the results.  
* **F-12: Display Results:** The frontend will display the generated SQL and the query results in a clean, readable format.

### **2.4. Query History**

* **F-13: Log Queries:** The system will automatically save a history of every query a user runs, including the natural language question, the generated SQL, and a timestamp.  
* **F-14: View History:** Users can view their past queries, allowing them to easily re-run or reference them.

## **3\. Functional Flows & System Architecture**

This section details the step-by-step process for the core functionalities.

### **3.1. Flow: Adding a New Database Connection**

1. **User Action:** A logged-in user navigates to the "Connections" page and clicks "Add New Connection".  
2. **Frontend:** A form is displayed asking for:  
   * Connection Nickname (e.g., "Production API", "Staging Analytics")  
   * Supabase URL  
   * Supabase Anon Key  
3. **API Call:** The user clicks "Save". The frontend sends a POST request to /api/connections/add with the form data and the user's JWT in the Authorization header.  
4. Backend \- Validation:  
   a. The auth middleware verifies the JWT.  
   b. The endpoint receives the credentials.  
   c. It attempts to establish a temporary connection to the user's Supabase instance.  
   d. To validate, it runs a basic schema-fetching command (e.g., calls the get\_tables() function).  
5. Backend \- Storage:  
   a. If validation is successful, the backend encrypts the supabaseAnonKey.  
   b. It saves the nickname, url, and encrypted key into an array within that user's document in the application's MongoDB.  
   c. A success message is sent back to the frontend.  
6. **Frontend:** The UI displays a "Connection successful\!" message and updates the list of connections. If validation fails, an error message like "Connection failed. Please check credentials." is shown.

### **3.2. Flow: The Core Query Process (End-to-End)**

This is the main user workflow.

1. **User Action:** The user selects a saved database connection from a dropdown on the main dashboard.  
2. **API Call (Schema Fetch):** The frontend sends a GET request to /api/connections/:connectionId/prepare-schema.  
3. Backend \- Schema Generation:  
   a. The auth middleware verifies the JWT.  
   b. The backend retrieves the specified connection details for that user, decrypting the key.  
   c. It connects to the user's Supabase instance.  
   d. It executes a series of queries against the user's database to build a comprehensive schema context string. This involves calling the custom get\_tables and get\_columns functions, and also querying information\_schema.key\_column\_usage, information\_schema.table\_constraints, etc., to find relationships and constraints.  
   e. Example Schema String:  
   \-- Schema for PostgreSQL database  
   \-- Tables and Columns:  
   CREATE TABLE users (  
     id BIGINT PRIMARY KEY,  
     email VARCHAR(255) UNIQUE NOT NULL,  
     created\_at TIMESTAMPTZ  
   );  
   CREATE TABLE orders (  
     id BIGINT PRIMARY KEY,  
     user\_id BIGINT,  
     amount DECIMAL,  
     order\_date DATE  
   );

   \-- Relationships:  
   \-- orders.user\_id is a foreign key that references users.id

   f. This generated schema string is cached on the server (e.g., using Redis or in-memory cache with a TTL of 10 minutes) with a key like user:USER\_ID:connection:CONNECTION\_ID:schema.  
   g. A success response is sent to the frontend, indicating the selection is ready.  
4. **User Action:** The user types a question, "How many orders has each user placed?", and clicks "Generate & Run".  
5. **API Call (Query Generation):** The frontend sends a POST request to /api/query/generate-sql with the connectionId and the naturalLanguageQuery.  
6. Backend \- AI & Execution:  
   a. The auth middleware verifies the JWT.  
   b. It retrieves the cached schema string.  
   c. It constructs a detailed prompt for the Gemini API, including the schema and the user's question.  
   d. The Gemini API returns a SQL string: SELECT u.email, COUNT(o.id) FROM users u JOIN orders o ON u.id \= o.user\_id GROUP BY u.email;  
   e. The backend connects to the user's Supabase DB again.  
   f. It executes the received SQL using the execute\_sql function.  
   g. It logs the request, SQL, and status to the QueryHistory collection in MongoDB.  
   h. It returns a JSON object to the frontend containing { generatedSql: "...", results: \[...\] }.  
7. **Frontend:** The UI updates to display the generatedSql in a code block and the results in a formatted table.

## **4\. Data Models (Application's MongoDB)**

// Mongoose Schema for the 'User' model  
const userSchema \= new mongoose.Schema({  
    username: { type: String, required: true, unique: true },  
    email: { type: String, required: true, unique: true },  
    password: { type: String, required: true }, // Will be hashed  
    connections: \[  
        {  
            nickname: { type: String, required: true },  
            supabaseUrl: { type: String, required: true },  
            supabaseAnonKey: { type: String, required: true }, // Will be encrypted  
        }  
    \]  
});

// Mongoose Schema for the 'QueryHistory' model  
const queryHistorySchema \= new mongoose.Schema({  
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
    connectionId: { type: mongoose.Schema.Types.ObjectId, required: true },  
    naturalLanguageQuery: { type: String, required: true },  
    generatedSql: { type: String, required: true },  
    status: { type: String, enum: \['success', 'error'\], required: true },  
    executionTime: { type: Number }, // in milliseconds  
    createdAt: { type: Date, default: Date.now }  
});

## **5\. API Endpoints Summary**

* **Auth:**  
  * POST /api/auth/register  
  * POST /api/auth/login  
* **Connections:**  
  * POST /api/connections/add (Protected)  
  * GET /api/connections (Protected)  
  * PUT /api/connections/:id (Protected)  
  * DELETE /api/connections/:id (Protected)  
* **Querying:**  
  * GET /api/connections/:connectionId/prepare-schema (Protected)  
  * POST /api/query/generate-sql (Protected)  
* **History:**  
  * GET /api/history (Protected)