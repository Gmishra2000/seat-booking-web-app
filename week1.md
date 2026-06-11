# Week 1 Implementation Guide: Backend Foundation Setup

## **Your Week 1 Mission**

Build a working Node.js backend with:
- ✅ Express server running on port 5000
- ✅ MongoDB connection (Atlas free tier)
- ✅ User authentication (JWT + bcrypt)
- ✅ User registration endpoint
- ✅ User login endpoint
- ✅ Protected endpoints with auth middleware
- ✅ Working Postman tests

**By Friday**: You'll have a working backend that authenticates users.

---

## **Step 1: Project Setup (Day 1)**

### **1.1: Create Project Directory**

```bash
# Create and navigate to project directory
mkdir seat-booking-app
cd seat-booking-app

# Initialize Node.js project
npm init -y

# Create folders
mkdir -p server/{models,routes,middleware,config,services}
mkdir -p logs
```

### **1.2: Install Dependencies**

```bash
# Core dependencies
npm install express mongoose dotenv bcryptjs jsonwebtoken cors

# Dev dependencies (for auto-reload)
npm install --save-dev nodemon

# Optional: For better logging (Week 2)
npm install winston
```

**What each does**:
- `express`: Web framework
- `mongoose`: MongoDB connection & models
- `dotenv`: Environment variables
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT tokens
- `cors`: Cross-origin requests
- `nodemon`: Auto-reload on file changes

### **1.3: Create .env File**

**Create: `.env` in root directory**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seat-booking

# JWT
JWT_SECRET=your_super_secret_key_change_in_production_12345
JWT_EXPIRE=7d

# Logging
LOG_LEVEL=info
```

**⚠️ IMPORTANT**:
- Replace `username`, `password`, `cluster` with your MongoDB Atlas credentials
- Never commit this file to GitHub (add to `.gitignore`)
- Change JWT_SECRET to something random

### **1.4: Create .gitignore**

**Create: `.gitignore` in root**

```
node_modules/
.env
.env.local
.DS_Store
logs/
dist/
build/
*.log
```

### **1.5: Update package.json**

**Edit: `package.json` - Replace scripts section**

```json
"scripts": {
  "start": "node server/server.js",
  "dev": "nodemon server/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

**Now run**:
```bash
npm run dev
# Should output: [nodemon] watching for file changes...
```

---

## **Step 2: Database Setup (Day 1-2)**

### **2.1: MongoDB Atlas Setup**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a free cluster (M0 tier, 512MB)
4. Create database user:
   - Username: `seatbooking`
   - Password: Generate strong password
5. Whitelist IP: Allow from anywhere (0.0.0.0/0) for development
6. Get connection string:
   - Connection string format:
   ```
   mongodb+srv://seatbooking:PASSWORD@cluster0.xxxxx.mongodb.net/seat-booking?retryWrites=true&w=majority
   ```
7. Update `.env` with this string

### **2.2: Create Database Configuration**

**Create: `server/config/db.js`**

```javascript
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### **2.3: Create Logger Configuration**

**Create: `server/config/logger.js`**

```javascript
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    console.error(logMessage);
    fs.appendFileSync(path.join(logsDir, 'error.log'), logMessage);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    console.warn(logMessage);
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
  }
};

module.exports = logger;
```

---

## **Step 3: Create User Model (Day 2)**

### **3.1: User Schema with Password Hashing**

**Create: `server/models/User.js`**

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    minlength: 3,
    maxlength: 50,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // Don't return password by default
  },
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (middleware)
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**What This Does**:
- `userSchema.pre('save', ...)` - Automatically hash password before saving
- `comparePassword()` - Compare login password with hashed version

---

## **Step 4: Authentication Middleware (Day 3)**

### **4.1: JWT Middleware**

**Create: `server/middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
```

### **4.2: Error Handling Middleware**

**Create: `server/middleware/errorHandler.js`**

```javascript
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  // Default error
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific MongoDB errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
```

---

## **Step 5: Create Authentication Routes (Day 3-4)**

### **5.1: Auth Service**

**Create: `server/services/authService.js`**

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Register new user
const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === userData.email ? 'Email' : 'Username';
      throw new Error(`${field} already exists`);
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    logger.info(`User registered: ${user.email}`);

    // Generate token
    const token = generateToken(user._id, user.role);

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = generateToken(user._id, user.role);

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

module.exports = { registerUser, loginUser, generateToken };
```

### **5.2: Auth Routes**

**Create: `server/routes/auth.js`**

```javascript
const express = require('express');
const { registerUser, loginUser } = require('../services/authService');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../config/logger');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, firstname, lastname, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    // Register user
    const result = await registerUser({
      username,
      email,
      password,
      firstname,
      lastname,
      phone
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Login user
    const result = await loginUser(email, password);

    res.json(result);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/auth/profile (protected)
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## **Step 6: Create Main Server File (Day 4)**

### **6.1: Express Server Setup**

**Create: `server/server.js`**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./routes/auth');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Log requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📚 API Base URL: http://localhost:${PORT}/api`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
```

---

## **Step 7: Test Your Backend (Day 5)**

### **7.1: Start the Server**

```bash
npm run dev
```

**Expected output**:
```
[nodemon] watching for file changes...
🔌 Connecting to MongoDB...
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
📚 API Base URL: http://localhost:5000/api
💚 Health check: http://localhost:5000/health
```

### **7.2: Test with Postman**

**Install Postman**: https://www.postman.com/downloads/

#### **Test 1: Health Check**

```
GET http://localhost:5000/health

Response:
{
  "status": "OK",
  "message": "Server is running"
}
```

#### **Test 2: Register User**

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstname": "John",
  "lastname": "Doe",
  "phone": "+91-9999999999"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Save the token!** You'll use it for the next test.

#### **Test 3: Login User**

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### **Test 4: Get Profile (Protected)**

```
GET http://localhost:5000/api/auth/profile
Authorization: Bearer {TOKEN_FROM_PREVIOUS_RESPONSE}

Response (200):
{
  "success": true,
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "phone": "+91-9999999999",
    "role": "user",
    "createdAt": "2024-01-15T10:30:45.123Z"
  }
}
```

#### **Test 5: Test Without Token (Should Fail)**

```
GET http://localhost:5000/api/auth/profile
(No Authorization header)

Response (401):
{
  "error": "No token, authorization denied"
}
```

### **7.3: Test Error Cases**

#### **Duplicate Email**

```
POST http://localhost:5000/api/auth/register

{
  "username": "different_user",
  "email": "john@example.com",  // Same as before
  "password": "SecurePass123"
}

Response (400):
{
  "error": "Email already exists"
}
```

#### **Weak Password**

```
POST http://localhost:5000/api/auth/register

{
  "username": "jane_doe",
  "email": "jane@example.com",
  "password": "123"  // Less than 8 characters
}

Response (400):
{
  "error": "Password must be at least 8 characters"
}
```

#### **Invalid Login**

```
POST http://localhost:5000/api/auth/login

{
  "email": "john@example.com",
  "password": "WrongPassword123"
}

Response (401):
{
  "error": "Invalid email or password"
}
```

---

## **Step 8: Commit to GitHub (Day 5)**

### **8.1: Initialize Git & Create Repository**

```bash
# Initialize git locally
git init

# Create GitHub repository:
# 1. Go to https://github.com/new
# 2. Name it: seat-booking-app
# 3. Add .gitignore template: Node
# 4. Copy the remote URL

# Connect local to remote
git remote add origin https://github.com/YOUR_USERNAME/seat-booking-app.git

# Add all files
git add .

# Commit
git commit -m "Week 1: Backend foundation - Auth setup with JWT & MongoDB"

# Push to GitHub
git branch -M main
git push -u origin main
```

### **8.2: Verify on GitHub**

Check your repository on GitHub to confirm files are there.

---

## **Troubleshooting**

### **Problem: MongoDB Connection Fails**

```
Error: connect ECONNREFUSED
```

**Solution**:
1. Check `.env` file has correct MongoDB URI
2. Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for dev)
3. Check database user password is correct
4. Test connection string in MongoDB Atlas UI

### **Problem: "Port 5000 already in use"**

```bash
# Kill process using port 5000
# On macOS/Linux:
lsof -i :5000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### **Problem: Postman Shows "Cannot GET /api/auth/profile"**

**Solution**:
- Make sure you're using POST (for register/login) or GET (for profile)
- Check the exact URL path
- Verify Authorization header is set correctly

### **Problem: Token Error "Invalid token"**

**Solution**:
- JWT_SECRET in `.env` might have changed
- Token might be corrupted
- Copy fresh token from login response and use it

---

## **Your Week 1 Checklist**

- [ ] Node.js & npm installed
- [ ] Project folder created
- [ ] Dependencies installed
- [ ] `.env` file created with MongoDB URI
- [ ] Database configuration working
- [ ] User model created with password hashing
- [ ] Authentication service created
- [ ] Auth routes created (register, login, profile)
- [ ] Server running on port 5000
- [ ] Health check working
- [ ] Postman tests passing
  - [ ] Register user
  - [ ] Login user
  - [ ] Get profile (with token)
  - [ ] Get profile fails without token
  - [ ] Duplicate email error
  - [ ] Weak password error
- [ ] Code committed to GitHub with message

---

## **What You've Built**

✅ **Secure Authentication**
- Password hashing with bcrypt (10 rounds)
- JWT token generation & verification
- Protected endpoints

✅ **Error Handling**
- Validation errors
- Duplicate field errors
- Authentication errors

✅ **Best Practices**
- Environment variables (.env)
- Middleware architecture
- Service layer separation
- Proper logging

✅ **Ready for Next Week**
- Foundation for adding more routes
- Database connection established
- Authentication pattern set up

---

## **Next Week (Preview)**

Week 2 you'll add:
- Movie management (CRUD)
- Show management (CRUD)
- Admin role verification
- More complex data relationships

---

**You've successfully completed Week 1! 🎉**

**Next step**: Read Week 2 section of roadmap and continue building.

**Questions?**: Reference the API spec and requirements document to understand what each piece does.

**Keep pushing!** 💪# Week 1 Implementation Guide: Backend Foundation Setup

## **Your Week 1 Mission**

Build a working Node.js backend with:
- ✅ Express server running on port 5000
- ✅ MongoDB connection (Atlas free tier)
- ✅ User authentication (JWT + bcrypt)
- ✅ User registration endpoint
- ✅ User login endpoint
- ✅ Protected endpoints with auth middleware
- ✅ Working Postman tests

**By Friday**: You'll have a working backend that authenticates users.

---

## **Step 1: Project Setup (Day 1)**

### **1.1: Create Project Directory**

```bash
# Create and navigate to project directory
mkdir seat-booking-app
cd seat-booking-app

# Initialize Node.js project
npm init -y

# Create folders
mkdir -p server/{models,routes,middleware,config,services}
mkdir -p logs
```

### **1.2: Install Dependencies**

```bash
# Core dependencies
npm install express mongoose dotenv bcryptjs jsonwebtoken cors

# Dev dependencies (for auto-reload)
npm install --save-dev nodemon

# Optional: For better logging (Week 2)
npm install winston
```

**What each does**:
- `express`: Web framework
- `mongoose`: MongoDB connection & models
- `dotenv`: Environment variables
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT tokens
- `cors`: Cross-origin requests
- `nodemon`: Auto-reload on file changes

### **1.3: Create .env File**

**Create: `.env` in root directory**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seat-booking

# JWT
JWT_SECRET=your_super_secret_key_change_in_production_12345
JWT_EXPIRE=7d

# Logging
LOG_LEVEL=info
```

**⚠️ IMPORTANT**:
- Replace `username`, `password`, `cluster` with your MongoDB Atlas credentials
- Never commit this file to GitHub (add to `.gitignore`)
- Change JWT_SECRET to something random

### **1.4: Create .gitignore**

**Create: `.gitignore` in root**

```
node_modules/
.env
.env.local
.DS_Store
logs/
dist/
build/
*.log
```

### **1.5: Update package.json**

**Edit: `package.json` - Replace scripts section**

```json
"scripts": {
  "start": "node server/server.js",
  "dev": "nodemon server/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

**Now run**:
```bash
npm run dev
# Should output: [nodemon] watching for file changes...
```

---

## **Step 2: Database Setup (Day 1-2)**

### **2.1: MongoDB Atlas Setup**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a free cluster (M0 tier, 512MB)
4. Create database user:
   - Username: `seatbooking`
   - Password: Generate strong password
5. Whitelist IP: Allow from anywhere (0.0.0.0/0) for development
6. Get connection string:
   - Connection string format:
   ```
   mongodb+srv://seatbooking:PASSWORD@cluster0.xxxxx.mongodb.net/seat-booking?retryWrites=true&w=majority
   ```
7. Update `.env` with this string

### **2.2: Create Database Configuration**

**Create: `server/config/db.js`**

```javascript
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### **2.3: Create Logger Configuration**

**Create: `server/config/logger.js`**

```javascript
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    console.error(logMessage);
    fs.appendFileSync(path.join(logsDir, 'error.log'), logMessage);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    console.warn(logMessage);
    fs.appendFileSync(path.join(logsDir, 'app.log'), logMessage);
  }
};

module.exports = logger;
```

---

## **Step 3: Create User Model (Day 2)**

### **3.1: User Schema with Password Hashing**

**Create: `server/models/User.js`**

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    minlength: 3,
    maxlength: 50,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // Don't return password by default
  },
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (middleware)
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**What This Does**:
- `userSchema.pre('save', ...)` - Automatically hash password before saving
- `comparePassword()` - Compare login password with hashed version

---

## **Step 4: Authentication Middleware (Day 3)**

### **4.1: JWT Middleware**

**Create: `server/middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
```

### **4.2: Error Handling Middleware**

**Create: `server/middleware/errorHandler.js`**

```javascript
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  // Default error
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific MongoDB errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
```

---

## **Step 5: Create Authentication Routes (Day 3-4)**

### **5.1: Auth Service**

**Create: `server/services/authService.js`**

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Register new user
const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === userData.email ? 'Email' : 'Username';
      throw new Error(`${field} already exists`);
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    logger.info(`User registered: ${user.email}`);

    // Generate token
    const token = generateToken(user._id, user.role);

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = generateToken(user._id, user.role);

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

module.exports = { registerUser, loginUser, generateToken };
```

### **5.2: Auth Routes**

**Create: `server/routes/auth.js`**

```javascript
const express = require('express');
const { registerUser, loginUser } = require('../services/authService');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../config/logger');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, firstname, lastname, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    // Register user
    const result = await registerUser({
      username,
      email,
      password,
      firstname,
      lastname,
      phone
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Login user
    const result = await loginUser(email, password);

    res.json(result);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/auth/profile (protected)
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## **Step 6: Create Main Server File (Day 4)**

### **6.1: Express Server Setup**

**Create: `server/server.js`**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./routes/auth');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Log requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📚 API Base URL: http://localhost:${PORT}/api`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
```

---

## **Step 7: Test Your Backend (Day 5)**

### **7.1: Start the Server**

```bash
npm run dev
```

**Expected output**:
```
[nodemon] watching for file changes...
🔌 Connecting to MongoDB...
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
📚 API Base URL: http://localhost:5000/api
💚 Health check: http://localhost:5000/health
```

### **7.2: Test with Postman**

**Install Postman**: https://www.postman.com/downloads/

#### **Test 1: Health Check**

```
GET http://localhost:5000/health

Response:
{
  "status": "OK",
  "message": "Server is running"
}
```

#### **Test 2: Register User**

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstname": "John",
  "lastname": "Doe",
  "phone": "+91-9999999999"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Save the token!** You'll use it for the next test.

#### **Test 3: Login User**

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### **Test 4: Get Profile (Protected)**

```
GET http://localhost:5000/api/auth/profile
Authorization: Bearer {TOKEN_FROM_PREVIOUS_RESPONSE}

Response (200):
{
  "success": true,
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "phone": "+91-9999999999",
    "role": "user",
    "createdAt": "2024-01-15T10:30:45.123Z"
  }
}
```

#### **Test 5: Test Without Token (Should Fail)**

```
GET http://localhost:5000/api/auth/profile
(No Authorization header)

Response (401):
{
  "error": "No token, authorization denied"
}
```

### **7.3: Test Error Cases**

#### **Duplicate Email**

```
POST http://localhost:5000/api/auth/register

{
  "username": "different_user",
  "email": "john@example.com",  // Same as before
  "password": "SecurePass123"
}

Response (400):
{
  "error": "Email already exists"
}
```

#### **Weak Password**

```
POST http://localhost:5000/api/auth/register

{
  "username": "jane_doe",
  "email": "jane@example.com",
  "password": "123"  // Less than 8 characters
}

Response (400):
{
  "error": "Password must be at least 8 characters"
}
```

#### **Invalid Login**

```
POST http://localhost:5000/api/auth/login

{
  "email": "john@example.com",
  "password": "WrongPassword123"
}

Response (401):
{
  "error": "Invalid email or password"
}
```

---

## **Step 8: Commit to GitHub (Day 5)**

### **8.1: Initialize Git & Create Repository**

```bash
# Initialize git locally
git init

# Create GitHub repository:
# 1. Go to https://github.com/new
# 2. Name it: seat-booking-app
# 3. Add .gitignore template: Node
# 4. Copy the remote URL

# Connect local to remote
git remote add origin https://github.com/YOUR_USERNAME/seat-booking-app.git

# Add all files
git add .

# Commit
git commit -m "Week 1: Backend foundation - Auth setup with JWT & MongoDB"

# Push to GitHub
git branch -M main
git push -u origin main
```

### **8.2: Verify on GitHub**

Check your repository on GitHub to confirm files are there.

---

## **Troubleshooting**

### **Problem: MongoDB Connection Fails**

```
Error: connect ECONNREFUSED
```

**Solution**:
1. Check `.env` file has correct MongoDB URI
2. Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for dev)
3. Check database user password is correct
4. Test connection string in MongoDB Atlas UI

### **Problem: "Port 5000 already in use"**

```bash
# Kill process using port 5000
# On macOS/Linux:
lsof -i :5000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### **Problem: Postman Shows "Cannot GET /api/auth/profile"**

**Solution**:
- Make sure you're using POST (for register/login) or GET (for profile)
- Check the exact URL path
- Verify Authorization header is set correctly

### **Problem: Token Error "Invalid token"**

**Solution**:
- JWT_SECRET in `.env` might have changed
- Token might be corrupted
- Copy fresh token from login response and use it

---

## **Your Week 1 Checklist**

- [ ] Node.js & npm installed
- [ ] Project folder created
- [ ] Dependencies installed
- [ ] `.env` file created with MongoDB URI
- [ ] Database configuration working
- [ ] User model created with password hashing
- [ ] Authentication service created
- [ ] Auth routes created (register, login, profile)
- [ ] Server running on port 5000
- [ ] Health check working
- [ ] Postman tests passing
  - [ ] Register user
  - [ ] Login user
  - [ ] Get profile (with token)
  - [ ] Get profile fails without token
  - [ ] Duplicate email error
  - [ ] Weak password error
- [ ] Code committed to GitHub with message

---

## **What You've Built**

✅ **Secure Authentication**
- Password hashing with bcrypt (10 rounds)
- JWT token generation & verification
- Protected endpoints

✅ **Error Handling**
- Validation errors
- Duplicate field errors
- Authentication errors

✅ **Best Practices**
- Environment variables (.env)
- Middleware architecture
- Service layer separation
- Proper logging

✅ **Ready for Next Week**
- Foundation for adding more routes
- Database connection established
- Authentication pattern set up

---

## **Next Week (Preview)**

Week 2 you'll add:
- Movie management (CRUD)
- Show management (CRUD)
- Admin role verification
- More complex data relationships

---

**You've successfully completed Week 1! 🎉**

**Next step**: Read Week 2 section of roadmap and continue building.

**Questions?**: Reference the API spec and requirements document to understand what each piece does.

**Keep pushing!** 💪