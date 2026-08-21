# TMS - Quick Reference

## Core Commands

### Backend
```bash
cd backend
npm install          # First time setup
npm run dev          # Start development server
```

### Frontend
```bash
cd frontend
npm install          # First time setup
npm start            # Start development server
```

## Key Endpoints

| Method | Endpoint | Auth Required | Role Required |
|--------|----------|---------------|---------------|
| POST | `/api/auth/register` | No | - |
| POST | `/api/auth/login` | No | - |
| GET | `/api/auth/profile` | Yes | - |
| GET | `/api/departments` | Yes | - |
| POST | `/api/departments` | Yes | SuperAdmin |
| GET | `/api/programmes` | Yes | - |
| POST | `/api/programmes` | Yes | SuperAdmin |
| GET | `/api/blocks` | Yes | - |
| POST | `/api/blocks` | Yes | SuperAdmin |
| GET | `/api/rooms` | Yes | - |
| POST | `/api/rooms` | Yes | SuperAdmin |
| GET | `/api/roles` | Yes | - |
| POST | `/api/roles` | Yes | SuperAdmin |
| GET | `/api/users` | Yes | SuperAdmin |
| POST | `/api/users` | Yes | SuperAdmin |

## Default Credentials

- **Username**: superadmin
- **Email**: superadmin@example.com
- **Password**: SuperAdmin@123
- **Role**: SuperAdmin

## Frontend Routes

| Path | Component | Access |
|------|-----------|--------|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/departments` | DepartmentPage | SuperAdmin |
| `/programmes` | ProgrammePage | SuperAdmin |
| `/blocks` | BlockPage | SuperAdmin |
| `/rooms` | RoomPage | SuperAdmin |
| `/roles` | RolePage | SuperAdmin |
| `/users` | UserPage | SuperAdmin |

## Available Roles

- SuperAdmin - Full system access
- User - Basic access
- Networking Staff - Networking complaints
- Plumber - Plumbing complaints
- Electrician - Electrical complaints
- Software Developer - Software complaints

## Database Collections

1. **users** - User accounts and profiles
2. **departments** - Department master data
3. **programmes** - Programme/course data
4. **blocks** - Building block data
5. **rooms** - Room/classroom data
6. **roles** - Role definitions

## Environment Setup

### Backend `.env`
```
MONGODB_URI=mongodb://localhost:27017/tms-complaints
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d
NODE_ENV=development
```

### Frontend (Automatic)
- API Base: `http://localhost:5000/api`
- Token Storage: localStorage

## Important Notes

1. MongoDB must be running before starting backend
2. Backend must be running before starting frontend
3. Only SuperAdmin can access master screens
4. JWT tokens expire in 7 days (configurable)
5. Passwords are hashed using bcryptjs
6. CORS enabled for localhost:3000

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Start MongoDB service |
| Port 5000 in use | Kill process or change PORT in .env |
| Port 3000 in use | Run `PORT=3001 npm start` |
| CORS errors | Ensure backend is running |
| Login fails | Check email and password |
| No departments showing | Create one first as SuperAdmin |

## API Testing

**Postman Collection Variables**:
```json
{
  "base_url": "http://localhost:5000/api",
  "token": "your_jwt_token_here"
}
```

**Common Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

## File Structure Summary

```
TMS-TEST-PROJECT/
├── backend/             # Node.js/Express backend
│   ├── config/         # Configuration files
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth & role checking
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   └── server.js       # Entry point
│
└── frontend/           # React frontend
    ├── public/         # Static files
    └── src/
        ├── components/ # React components
        ├── pages/      # Page components
        ├── services/   # API calls
        ├── context/    # Auth context
        └── App.js      # Root component
```

## Documentation Files

- **README.md** - Complete project documentation
- **POSTMAN_SETUP.md** - Postman API testing guide
- **STARTUP_GUIDE.md** - Step-by-step startup instructions
- **QUICK_REFERENCE.md** - This file

---

For detailed information, refer to the respective documentation files.
