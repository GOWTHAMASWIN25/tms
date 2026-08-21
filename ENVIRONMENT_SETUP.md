# Environment Setup Instructions

## Backend Environment Setup

### 1. Create `.env` file

Navigate to the `backend` folder and create a `.env` file:

```bash
cd backend
cp .env.example .env
```

### 2. Configure `.env`

Edit `backend/.env` and set these values:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/tms-complaints

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d
```

### Important Notes:

- **MONGODB_URI**: Points to your MongoDB instance
  - For local MongoDB: `mongodb://localhost:27017/tms-complaints`
  - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/tms-complaints`
  
- **JWT_SECRET**: Change this to a secure random string in production!
  - Example: `xK9$mP2@qL8vN5%rT3zF6`
  
- **NODE_ENV**: 
  - Use `development` for local testing
  - Use `production` for live deployment

---

## Frontend Configuration

The frontend automatically uses:
- **API Base URL**: `http://localhost:5000/api`
- **Token Storage**: Browser's localStorage
- **CORS**: Enabled from backend

No `.env` file needed for frontend development. To change the API base URL, edit `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api'; // Change this line
```

---

## MongoDB Setup

### Local MongoDB Installation

#### Windows:
1. Download from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Install MongoDB as a Service" during installation
4. MongoDB starts automatically

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### MongoDB Atlas (Cloud)

1. Visit [Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster
4. Get connection string
5. Replace `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/tms-complaints
   ```

### Verify MongoDB Connection

```bash
# Open MongoDB shell (if installed locally)
mongosh
```

Then test the connection:
```bash
# List databases
show dbs

# Switch to tms-complaints database
use tms-complaints

# List collections
show collections
```

---

## Node.js Setup

### Check Installation

```bash
# Check Node.js version (should be v14 or higher)
node --version

# Check npm version
npm --version
```

### Update npm (Optional but Recommended)

```bash
npm install -g npm@latest
```

---

## Installation Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Windows
# or
cp .env.example .env    # Mac/Linux

# Verify setup
npm run dev
```

You should see: `Server running on port 5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app opens at `http://localhost:3000`

---

## Postman Setup

### Import Configuration

1. Create a new Postman Collection
2. Set up these variables:
   ```json
   {
     "base_url": "http://localhost:5000/api",
     "token": ""
   }
   ```

### First Request - Login

```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperAdmin@123"
}
```

Copy the returned token and set:
```
POST-request Script:
pm.environment.set("token", pm.response.json().token);
```

### Add Token to Headers

For all protected requests:
```
Headers:
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## Common Environment Issues

### Issue: MongoDB Connection Error

**Error**: `MongoError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Ensure MongoDB is running
2. Check MongoDB URI in `.env`
3. Verify port 27017 is not blocked

```bash
# Windows - Check service
net start MongoDB

# Mac - Start MongoDB
brew services start mongodb-community

# Linux - Start MongoDB
sudo systemctl start mongod
```

### Issue: Port Already in Use

**Error**: `Error: listen EADDRINUSE :::5000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

### Issue: Module Not Found

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: JWT Token Errors

**Error**: `Invalid token` or `No token provided`

**Solution**:
1. Ensure Bearer token is in Authorization header
2. Check token is not expired
3. Verify JWT_SECRET matches in backend

---

## Development Workflow

### Starting Development

1. **Terminal 1 - MongoDB**
   ```bash
   mongod  # or use service manager
   ```

2. **Terminal 2 - Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Terminal 3 - Frontend**
   ```bash
   cd frontend
   npm start
   ```

### Making Changes

- **Backend**: Changes auto-reload with nodemon
- **Frontend**: Changes auto-reload with react-scripts
- **Database**: No restart needed for schema changes

### Testing API

Use Postman for API testing with stored tokens.

---

## Production Deployment

### Before Deploying

1. **Change JWT_SECRET**
   ```env
   JWT_SECRET=very_long_random_secure_string_here
   ```

2. **Set NODE_ENV to production**
   ```env
   NODE_ENV=production
   ```

3. **Use MongoDB Atlas** instead of local MongoDB

4. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

5. **Test Production Build**
   ```bash
   npm install -g serve
   serve -s build
   ```

---

## Docker Setup (Optional)

Create `backend/Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

Create `docker-compose.yml`:
```yaml
version: '3'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/tms-complaints
    depends_on:
      - mongodb
  frontend:
    image: node:18
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    command: npm start
```

Run:
```bash
docker-compose up
```

---

## Verification Checklist

- [ ] MongoDB is running
- [ ] Node.js and npm installed
- [ ] Backend `.env` configured
- [ ] Dependencies installed
- [ ] Backend server starts on port 5000
- [ ] Frontend starts on port 3000
- [ ] Can access `http://localhost:3000`
- [ ] Can login with SuperAdmin credentials
- [ ] Can access master screens as SuperAdmin

---

## Support

If you encounter issues:

1. Check the [README.md](./README.md) for API documentation
2. Review [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) for step-by-step instructions
3. Check error messages carefully
4. Verify all services are running
5. Clear cache and reinstall if needed

```bash
# Full reset
rm -rf backend/node_modules frontend/node_modules
npm install --prefix backend
npm install --prefix frontend
```

---

**Ready to develop!** Start all three terminals and begin building features.
