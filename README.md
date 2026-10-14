# TMS - Complaint Management System

## Project Overview

A comprehensive complaint management system built with the MERN stack (MongoDB, Express, React, Node.js) to streamline the process of receiving, recording, and addressing complaints related to hardware, software, and various other issues.

## Technology Stack

- **Frontend**: React 18.2.0, React Router DOM
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure

```
TMS-TEST-PROJECT/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── departmentController.js
│   │   ├── programmeController.js
│   │   ├── blockController.js
│   │   ├── roomController.js
│   │   ├── roleController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Programme.js
│   │   ├── Block.js
│   │   ├── Room.js
│   │   └── Role.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── programmeRoutes.js
│   │   ├── blockRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── roleRoutes.js
│   │   └── userRoutes.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── Navbar.css
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── LoginPage.js
    │   │   ├── LoginPage.css
    │   │   ├── DepartmentPage.js
    │   │   └── MasterScreen.css
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   ├── index.css
    │   └── package.json
```

## Installation

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string and JWT secret

5. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The app will open on `http://localhost:3000`

### GoExpo Mobile App (Expo)

The native Android/iOS client is in `mobile/` and uses the existing backend API.

1. Install Node.js and Expo Go on your phone. Start MongoDB and the backend as described above.
2. In a terminal, navigate to `mobile/` and install dependencies:
   ```bash
   npm install
   ```
3. Copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, for example `http://192.168.1.25:5000/api`. A physical phone cannot reach your computer using `localhost`; connect both devices to the same network and allow the backend port through the firewall.
4. Start Expo:
   ```bash
   npm start
   ```
5. Scan the QR code in Expo Go. Use `npm run android` or `npm run ios` when running an emulator/simulator.

The mobile client includes sign-in with securely stored tokens, a request overview, ticket listing and status updates, a ticket form with optional photo/document attachments, and a SuperAdmin area for staff assignment, reports/CSV export, and department/programme/block/room/role/user management. See [mobile/README.md](./mobile/README.md) for Expo Go testing and EAS preview/store build instructions. A production API URL, Expo project link, signing credentials, and store accounts are required for publishing.

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register a new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/profile` - Get authenticated user profile

### Departments
- **GET** `/api/departments` - Get all departments
- **GET** `/api/departments/:id` - Get department by ID
- **POST** `/api/departments` - Create department (SuperAdmin only)
- **PUT** `/api/departments/:id` - Update department (SuperAdmin only)
- **DELETE** `/api/departments/:id` - Delete department (SuperAdmin only)

### Programmes
- **GET** `/api/programmes` - Get all programmes
- **GET** `/api/programmes/:id` - Get programme by ID
- **POST** `/api/programmes` - Create programme (SuperAdmin only)
- **PUT** `/api/programmes/:id` - Update programme (SuperAdmin only)
- **DELETE** `/api/programmes/:id` - Delete programme (SuperAdmin only)

### Blocks
- **GET** `/api/blocks` - Get all blocks
- **GET** `/api/blocks/:id` - Get block by ID
- **POST** `/api/blocks` - Create block (SuperAdmin only)
- **PUT** `/api/blocks/:id` - Update block (SuperAdmin only)
- **DELETE** `/api/blocks/:id` - Delete block (SuperAdmin only)

### Rooms
- **GET** `/api/rooms` - Get all rooms
- **GET** `/api/rooms/:id` - Get room by ID
- **POST** `/api/rooms` - Create room (SuperAdmin only)
- **PUT** `/api/rooms/:id` - Update room (SuperAdmin only)
- **DELETE** `/api/rooms/:id` - Delete room (SuperAdmin only)

### Roles
- **GET** `/api/roles` - Get all roles
- **GET** `/api/roles/:id` - Get role by ID
- **POST** `/api/roles` - Create role (SuperAdmin only)
- **PUT** `/api/roles/:id` - Update role (SuperAdmin only)
- **DELETE** `/api/roles/:id` - Delete role (SuperAdmin only)

### Users
- **GET** `/api/users` - Get all users (SuperAdmin only)
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create user (SuperAdmin only)
- **PUT** `/api/users/:id` - Update user (SuperAdmin only)
- **DELETE** `/api/users/:id` - Delete user (SuperAdmin only)

## Database Models

### User
- username (unique, required)
- email (unique, required)
- phone (required)
- password (hashed, required)
- role (enum: SuperAdmin, User, Networking Staff, Plumber, Electrician, Software Developer, PC Hardware)
- department (reference to Department)
- programme (reference to Programme)
- isActive (boolean, default: true)

-### Department
- name (unique, required)
- shortName (unique, min 2 chars, max 8 chars, required)
- description
- isActive (boolean, default: true)

-### Programme
- name (required)
- shortName (min 2 chars, max 8 chars, required)
- department (reference to Department, required)
- description
- isActive (boolean, default: true)

### Block
- name (required)
- department (reference to Department, required)
- programme (reference to Programme, required)
- description
- isActive (boolean, default: true)

### Room
- roomNumber (required)
- department (reference to Department, required)
- programme (reference to Programme, required)
- block (reference to Block, required)
- floor
- capacity
- description
- isActive (boolean, default: true)

### Role
- name (unique, required)
- description
- permissions (array of strings)
- isActive (boolean, default: true)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcryptjs for password encryption
- **Role-Based Access Control**: SuperAdmin role for master screen access
- **Authorization Middleware**: Protects sensitive endpoints
- **CORS**: Configured for frontend-backend communication

## Creating SuperAdmin User with Postman

See [POSTMAN_SETUP.md](./POSTMAN_SETUP.md) for detailed instructions.

## Frontend Features & UI Redesign (v2.0)

- **Ultra-Modern Glassmorphic UI**: High-contrast, dark obsidian theme with glowing accents, vibrant status indicators, and frosted glass cards.
- **Floating Glass Navbar**:
  - Organized "Master Directory ▾" dropdown for SuperAdmin so links never clutter.
  - User capsule with avatar, role badge, and fast logout.
  - Full mobile responsiveness with slide-down drawer menu.
- **Priority SLA Management**: Tickets tagged with `Urgent`, `High`, `Medium`, `Low` with animated pulsing alerts for critical issues.
- **Comprehensive Ticket Detail Modal**:
  - Interactive stepper: `[Submitted] ➔ [Assigned] ➔ [In-Progress] ➔ [Resolved]`
  - Full timeline log of all state updates, notes, and technician actions.
  - Evidence preview for attached photos/documents.
  - Work order assignment and resolution note entries.
- **User Satisfaction Star Ratings (1-5 Stars)**: Users can rate technicians upon ticket closure and leave feedback reviews.
- **Live Search & Multi-Filter Bar**: Real-time filtering by status pills, priority dropdown, and keyword search across title, ID, room, block, and staff.
- **Visual Analytics & Report Generator**:
  - KPI metric cards (Resolution Rate %, Quality Score, Urgent Backlog).
  - Visual category & priority distribution progress bars.
  - Filter query builder, CSV export, and print-ready layout.
- **Toast Notification System**: Real-time animated feedback alerts for all actions.
- **Demo Fast-Fill Credentials**: Instant 1-click test login for SuperAdmin, Staff, and Students.

## Available User Roles

- SuperAdmin - Full access to all master screens, dispatching, and reports
- User - Student/Faculty portal to raise tickets, track SLA, and rate service
- Networking Staff - Access to networking-related complaints
- Plumber - Access to plumbing-related complaints
- Electrician - Access to electrical-related complaints
- Software Developer - Access to software-related complaints
- PC Hardware Staff - Access to computer hardware issues

## Environment Variables

Backend `.env` file should contain:
```
MONGODB_URI=mongodb://localhost:27017/tms-complaints
PORT=5000
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRY=7d
NODE_ENV=development
```

## License

ISC
