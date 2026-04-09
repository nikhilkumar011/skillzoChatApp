const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors');
const multer  = require('multer')


const app = express();
app.use(cors());
app.use(express.json())
const server = createServer(app);
const io = new Server(server,{
    cors:{
        origin:'*',
    }
});


 
app.get('/', (req, res) => {
  res.send("Hello World");
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage });

app.post('/postfile', upload.single('file'), function (req, res, next) {
  const filepath = path.join('/uploads',req.file.filename);
  res.status(200).json({"path":filepath});
})




io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('joinGroup',async (msg)=>{
    console.log(msg,'joined');
   await socket.join("ROOM");
  })

  socket.on('joinNotice',(username)=>{
    socket.to('ROOM').emit('joinNotice',username);
  })

  socket.on('chatMessage',(msg)=>{
    socket.to('ROOM').emit("chatMessage",msg);
  })

  socket.on('typing',(username)=>{
    socket.to('ROOM').emit('typing',username);
  })

  socket.on('stopTyping',(username)=>{
    socket.to('ROOM').emit('stopTyping',username);
  })
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});