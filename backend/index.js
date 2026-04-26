const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const Dbconnection = require('./Dbconnection');
const Message = require("./models/Messages");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
Dbconnection();

app.use('/uploads', express.static(join(__dirname, 'uploads')));


const userRoute = require('./routes/userRoute.js');
const groupRoute = require('./routes/GroupRoute.js')

app.use('/user',userRoute);
app.use("/group", groupRoute);

app.get('/', (req, res) => res.send("Hello World"));




app.get("/messages/:groupId", async (req, res) => {
  try {
    const messages = await Message.find({
      groupId: req.params.groupId
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});






const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + Date.now() + '.' + ext);
  }
});

const upload = multer({ storage });

// ── Changed: return JSON with URL + mimetype instead of sending the raw file ──
app.post('/postfile', upload.single('file'), (req, res) => {
  res.status(200).json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype,          // e.g. "image/png", "application/pdf"
  });
});

const rooms = {}; // { groupId: [username1, username2] }

io.on("connection", (socket) => {
  console.log("a user connected");

  // ───── JOIN GROUP ─────
  socket.on("joinGroup", ({ username, groupId }) => {
    socket.username = username;
    socket.groupId = groupId;

    socket.join(groupId);

    // create room if not exists
    if (!rooms[groupId]) {
      rooms[groupId] = [];
    }

    // add user if not exists
    if (!rooms[groupId].includes(username)) {
      rooms[groupId].push(username);
    }

    // send updated members to ALL in room
    io.to(groupId).emit("roomMembers", rooms[groupId]);

    // notify others
    socket.to(groupId).emit("joinNotice", username);
  });

  // ───── CHAT MESSAGE ─────
  socket.on("chatMessage", async (msg) => {
    try {
      await Message.create(msg);

      // send to EVERYONE including sender (important)
      io.to(msg.groupId).emit("chatMessage", msg);
    } catch (err) {
      console.error("DB save error:", err);
    }
  });

  // ───── TYPING ─────
  socket.on("typing", () => {
    socket.to(socket.groupId).emit("typing", socket.username);
  });

  socket.on("stopTyping", () => {
    socket.to(socket.groupId).emit("stopTyping", socket.username);
  });

  // ───── DISCONNECT ─────
  socket.on("disconnect", () => {
    const { username, groupId } = socket;

    if (username && groupId && rooms[groupId]) {
      rooms[groupId] = rooms[groupId].filter(u => u !== username);

      // update members
      io.to(groupId).emit("roomMembers", rooms[groupId]);

      // stop typing if needed
      socket.to(groupId).emit("stopTyping", username);
    }
  });
});

server.listen(3000, () => console.log('server running at http://localhost:3000'));