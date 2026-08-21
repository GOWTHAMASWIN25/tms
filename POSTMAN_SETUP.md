# Postman Setup Guide

## Creating SuperAdmin User

Follow these steps to create a SuperAdmin user using Postman:

### Step 1: Start MongoDB and Backend Server

1. Ensure MongoDB is running on your local machine
2. Navigate to the backend directory and start the server:
   ```bash
   npm run dev
   ```

### Step 2: Register SuperAdmin User

1. Open Postman
2. Create a new POST request with the following URL:
   ```
   http://localhost:5000/api/auth/register
   ```

3. Go to the **Body** tab and select **raw** → **JSON**

4. Enter the following JSON data:
   ```json
   {
     "username": "superadmin",
     "email": "superadmin@example.com",
     "phone": "+1234567890",
     "password": "SuperAdmin@123",
     "role": "SuperAdmin",
     "department": "507f1f77bcf86cd799439011"
   }
   ```

   **Note**: You may need to create a Department first or use a valid MongoDB ObjectId

5. Click **Send**

6. You should receive a response:
   ```json
   {
     "message": "User registered successfully",
     "user": {
       "_id": "...",
       "username": "superadmin",
       "email": "superadmin@example.com",
       "phone": "+1234567890",
       "role": "SuperAdmin",
       "isActive": true
     }
   }
   ```

### Step 3: Login with SuperAdmin Credentials

1. Create a new POST request:
   ```
   http://localhost:5000/api/auth/login
   ```

2. Go to **Body** → **raw** → **JSON**

3. Enter:
   ```json
   {
     "email": "superadmin@example.com",
     "password": "SuperAdmin@123"
   }
   ```

4. Click **Send**

5. You will receive a response with a JWT token:
   ```json
   {
     "message": "Login successful",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "...",
       "username": "superadmin",
       "email": "superadmin@example.com",
       "role": "SuperAdmin"
     }
   }
   ```

### Step 4: Using the Token

1. Copy the token from the login response
2. For all subsequent requests that require authentication:
   - Go to the **Headers** tab
   - Add a new header:
     - Key: `Authorization`
     - Value: `Bearer <your_token_here>`

### Sample Requests

#### Create a Department

**URL**: POST `http://localhost:5000/api/departments`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Body** (raw JSON):
```json
{
  "name": "Computer Science",
    "shortName": "CSE1",
  "description": "Computer Science Department"
}
```

#### Create a Programme

**URL**: POST `http://localhost:5000/api/programmes`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Body** (raw JSON):
```json
{
  "name": "Bachelor of Technology",
    "shortName": "BTECH1",
  "department": "507f1f77bcf86cd799439011",
  "description": "Bachelor of Technology Programme"
}
```

#### Create a Block

**URL**: POST `http://localhost:5000/api/blocks`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Body** (raw JSON):
```json
{
  "name": "Block A",
  "department": "507f1f77bcf86cd799439011",
  "programme": "507f1f77bcf86cd799439012",
  "description": "Academic Block A"
}
```

#### Create a Room

**URL**: POST `http://localhost:5000/api/rooms`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Body** (raw JSON):
```json
{
  "roomNumber": "101",
  "department": "507f1f77bcf86cd799439011",
  "programme": "507f1f77bcf86cd799439012",
  "block": "507f1f77bcf86cd799439013",
  "floor": 1,
  "capacity": 40,
  "description": "Classroom 101"
}
```

#### Create a Role

**URL**: POST `http://localhost:5000/api/roles`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Body** (raw JSON):
```json
{
  "name": "Electrician",
  "description": "Handles electrical complaints",
  "permissions": ["view_complaints", "assign_tasks"]
}
```

#### Create a User

**URL**: POST `http://localhost:5000/api/users`

**Headers**:
```
Authorization: Bearer <your_jwt_token>
```

**Body** (raw JSON):
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "Password@123",
  "role": "Electrician",
  "department": "507f1f77bcf86cd799439011"
}
```

## Important Notes

- SuperAdmin is the only role that can access all master screens
- All API endpoints except `/api/auth/register` and `/api/auth/login` require authentication
- The JWT token expires in 7 days (configurable in `.env`)
- Always include the `Authorization` header with the `Bearer <token>` format
- Use valid MongoDB ObjectIds for department, programme, block, and room references
