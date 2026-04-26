# 💬 Skillzo ChatApp — Real-Time Group Chat Application

A full-stack real-time group chat application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB**. Users can sign up, create or join groups, and chat in real time with file sharing, emoji support, and typing indicators.

---

## 📸 Features

- 🔐 **Authentication** — Secure signup and login with JWT and bcrypt
- 🏠 **Dashboard** — Browse, search, filter, create, join, and leave groups
- 💬 **Real-time chat** — Instant messaging powered by Socket.IO
- 📁 **File sharing** — Send images, videos, PDFs, and documents
- 😊 **Emoji picker** — Built-in emoji support
- ⌨️ **Typing indicators** — See when others are typing
- 👥 **Live member list** — See who's currently in the room
- 🚪 **Leave group** — Leave any group you've joined
- 📱 **Responsive** — Works on mobile and desktop

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React | UI framework |
| React Router DOM | Client-side routing |
| Socket.IO Client | Real-time communication |
| Tailwind CSS | Styling |
| emoji-picker-react | Emoji picker |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| Socket.IO | WebSocket server |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| multer | File uploads |
| validator | Input validation |

---

## 📁 Project Structure

```
root/
├── backend/
│   ├── index.js                  # Entry point, Express + Socket.IO setup
│   ├── Dbconnection.js           # MongoDB connection
│   ├── models/
│   │   ├── userModel.js          # User schema (name, email, password, profilepic)
│   │   ├── Groups.js             # Group schema (name, category, admin, members)
│   │   └── Messages.js           # Message schema (groupId, username, text, fileUrl)
│   ├── controllers/
│   │   └── userController.js     # Signup and login logic
│   └── routes/
│       ├── userRoute.js          # /user/signup, /user/login
│       └── GroupRoute.js         # /group/create, /group/all, /group/join, /group/leave
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state (token, _id, email, name)
    │   ├── pages/
    │   │   ├── Login.jsx         # Login page
    │   │   ├── Signup.jsx        # Signup page
    │   │   └── Dashboard.jsx     # Groups dashboard
    │   ├── GroupChat.jsx         # Chat interface
    │   ├── connectWS.js          # Socket.IO connection helper
    │   └── App.jsx               # Routes and auth guards
    └── public/
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

---

### 1. Clone the repository

```bash
git clone https://github.com/nikhilkumar011/skillzoChatApp.git
cd chatapp
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
MONGO_URI=mongodb://localhost:27017/chatapp
SECRET=your_jwt_secret_key
PORT=3000
```

Create the uploads folder:

```bash
mkdir uploads
```

Start the backend:

```bash
node index.js
# or with nodemon
npx nodemon index.js
```

Backend runs at `http://localhost:3000`

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🔌 API Reference

### Auth Routes — `/user`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/user/signup` | `{ name, email, password }` | Register a new user |
| POST | `/user/login` | `{ email, password }` | Login and get token |

**Response (both):**
```json
{
  "token": "jwt_token",
  "email": "user@example.com",
  "_id": "mongo_object_id",
  "name": "John Doe"
}
```

---

### Group Routes — `/group`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/group/create` | `{ name, category, adminId }` | Create a new group |
| GET | `/group/all` | — | Fetch all groups |
| POST | `/group/join` | `{ groupId, userId }` | Join a group |
| POST | `/group/leave` | `{ groupId, userId }` | Leave a group |

**Categories:** `tech`, `life`, `gaming`, `study`, `other`

---

### Message Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages/:groupId` | Fetch all messages for a group |
| POST | `/postfile` | Upload a file, returns `{ fileUrl, fileType }` |

---

## 🔄 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinGroup` | `{ username, groupId }` | Join a chat room |
| `chatMessage` | `{ username, groupId, text, fileUrl, fileType, time }` | Send a message |
| `typing` | — | User started typing |
| `stopTyping` | — | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `chatMessage` | message object | Broadcast message to room |
| `roomMembers` | `[username, ...]` | Updated members list |
| `joinNotice` | `username` | Someone joined the room |
| `typing` | `username` | Someone is typing |
| `stopTyping` | `username` | Someone stopped typing |

---

## 🗺️ App Flow

```
/signup or /login
       ↓
  /dashboard
  - view all groups
  - create a group
  - join / leave a group
       ↓
  /chat/:groupId
  - real-time messaging
  - file sharing
  - typing indicators
  - leave group → back to dashboard
```

---

## 🔐 Authentication Flow

1. User signs up or logs in
2. Backend returns `{ token, email, _id, name }`
3. All four values are stored in `localStorage`
4. `AuthContext` reads them on app load and exposes them globally
5. Protected routes check for `token` — redirect to `/login` if missing
6. Public routes redirect to `/dashboard` if already logged in

---

## 📦 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/chatapp` |
| `SECRET` | JWT signing secret | `supersecretkey123` |
| `PORT` | Server port (optional) | `3000` |

---

## 🚀 Deployment Notes

- Set `MONGO_URI` to your MongoDB Atlas connection string in production
- Replace all `http://localhost:3000` references in the frontend with your deployed backend URL
- Configure CORS in `index.js` to allow your frontend domain instead of `*`
- The `uploads/` folder stores files locally — consider using AWS S3 or Cloudinary for production file storage

---

## 🐛 Known Issues & Notes

- File uploads are stored locally in `/uploads` — files are lost if the server restarts in certain environments
- The `rooms` object in `index.js` is in-memory — members list resets on server restart
- Password must be strong (uppercase, number, symbol) due to `validator.isStrongPassword()`

---

## 📄 License

MIT License — free to use and modify.
