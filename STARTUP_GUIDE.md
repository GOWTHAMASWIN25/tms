# Getting Started with TMS

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
3. **Postman** (for API testing) - [Download](https://www.postman.com/downloads/)

## Quick Start Guide

### Step 1: Start MongoDB

#### On Windows:
If MongoDB is installed as a service:
```bash
# It should start automatically
# Or start manually:
net start MongoDB
```

If you installed MongoDB manually:
```bash
# Navigate to MongoDB bin directory and run:
mongod
```

MongoDB will run on `mongodb://localhost:27017` by default.

### Step 2: Start Backend Server

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies (first time only):
   ```bash
   npm install
   ```

4. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # On Windows:
   copy .env.example .env
   ```

5. Edit `.env` and update if needed (defaults should work):
   ```
   MONGODB_URI=mongodb://localhost:27017/tms-complaints
   PORT=5000
   JWT_SECRET=your_secret_key_here_change_in_production
   JWT_EXPIRY=7d
   NODE_ENV=development
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

   You should see: `Server running on port 5000`

### Step 3: Create SuperAdmin User (Using Postman)

1. Open Postman
2. Create a POST request to: `http://localhost:5000/api/auth/register`
3. Set Body (raw JSON):
   ```json
   {
     "username": "superadmin",
     "email": "superadmin@example.com",
     "phone": "+1234567890",
     "password": "SuperAdmin@123",
     "role": "SuperAdmin",
     "department": "000000000000000000000000"
   }
   ```
   **Note**: The department ID is a placeholder. You'll need to create a department first or skip this field.

4. Alternative: Create without department first:
   ```json
   {
     "username": "superadmin",
     "email": "superadmin@example.com",
     "phone": "+1234567890",
     "password": "SuperAdmin@123",
     "role": "SuperAdmin",
     "department": null
   }
   ```

5. Send the request and note the token from the response

### Step 4: Start Frontend Server

1. Open another terminal/command prompt
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies (first time only):
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The app will automatically open in your browser at `http://localhost:3000`

## Using the Application

### Login

1. Go to `http://localhost:3000/login`
2. Enter your SuperAdmin credentials:
   - Email: `superadmin@example.com`
   - Password: `SuperAdmin@123`

### Master Screens

Once logged in as SuperAdmin, you can access:

- **Departments** (`/departments`) - Create, edit, delete departments
- **Programmes** (`/programmes`) - Create, edit, delete programmes
- **Blocks** (`/blocks`) - Create, edit, delete blocks
- **Rooms** (`/rooms`) - Create, edit, delete rooms
- **Roles** (`/roles`) - Create, edit, delete roles
- **Users** (`/users`) - Create, edit, delete users

## API Testing with Postman

### Get JWT Token

1. POST `http://localhost:5000/api/auth/login`
2. Body (raw JSON):
   ```json
   {
     "email": "superadmin@example.com",
     "password": "SuperAdmin@123"
   }
   ```
3. Copy the token from the response

### Use Token for API Calls

For all protected endpoints:
1. Go to **Headers** tab
2. Add:
   - Key: `Authorization`
   - Value: `Bearer <your_token_here>`

### Sample API Requests

**Create Department:**
```
POST http://localhost:5000/api/departments
Headers: Authorization: Bearer <token>
Body (raw JSON):
{
  "name": "Computer Science",
   "shortName": "CSE1",
  "description": "Computer Science Department"
}
```

**Get All Departments:**
```
GET http://localhost:5000/api/departments
Headers: Authorization: Bearer <token>
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Default: `mongodb://localhost:27017/tms-complaints`

### Port 5000 Already in Use
- Kill the process using port 5000:
  ```bash
  # On Windows:
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### Port 3000 Already in Use
- Change port in frontend or kill the process:
  ```bash
  # Set custom port:
  PORT=3001 npm start
  ```

### CORS Errors
- Ensure backend is running on `http://localhost:5000`
- Check that frontend API calls use correct backend URL

### Dependencies Issues
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

## Project File Structure

```
TMS-TEST-PROJECT/
├── backend/
│   ├── config/database.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── README.md
├── POSTMAN_SETUP.md
└── STARTUP_GUIDE.md
```

## Next Steps

1. Create departments, programmes, blocks, and rooms through the UI
2. Create roles for different user types
3. Create users and assign them to departments and roles
4. Set up complaint categories and types
5. Configure email notifications (future enhancement)

## Support

For detailed API documentation, see [README.md](./README.md)
For Postman setup details, see [POSTMAN_SETUP.md](./POSTMAN_SETUP.md)
