import express from 'express'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = 'Admin'

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.use(
  cors({
    origin: 'http://localhost:5173'
  })
)

const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// state
const UsersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray
  }
}

const io = new Server(expressServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Upon connection - only to user
  socket.emit('message', buildMsg(ADMIN, 'Welcome to the chat from the back!'))

  socket.on('enterRoom', ({ name, room }) => {
    const prevRoom = getUser(socket.id)?.room

    if (prevRoom) {
      socket.leave(prevRoom)
      socket.broadcast
        .to(prevRoom)
        .emit('message', buildMsg(ADMIN, `${getUser(socket.id).name} left the room`))
    }

    const user = activateUser(socket.id, name, room)

    if (prevRoom) {
      io.to(prevRoom).emit('userList', {
        users: getUserInRoom(prevRoom)
      })
    }

    socket.join(user.room)

    socket.emit('message', buildMsg(ADMIN, `Welcome ${user.name} to the room ${user.room}`))
    socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} joined the room`))
    io.to(user.room).emit('userList', {
      users: getUserInRoom(user.room)
    })
    io.emit('roomList', {
      rooms: getAllActiveRoom()
    })
  })

  socket.on('disconnect', () => {
    const user = getUser(socket.id)
    userLeavesApp(socket.id)

    if (user) {
      io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} left the room`))
      io.to(user.room).emit('userList', {
        users: getUserInRoom(user.room)
      })
      io.emit('roomList', {
        rooms: getAllActiveRoom()
      })
    }
    console.log(`Client disconnected: ${socket.id}`)
  })

  socket.on('message', ({ name, text, conversation_id }) => {
    const room = conversation_id
    if (room) {
      io.to(room).emit('message', buildMsg(name, text))
    }
  })

  socket.on('activity', (name) => {
    const room = getUser(socket.id)?.room
    if (room) {
      socket.broadcast.to(room).emit('activity', name)
    }
  })
})

function buildMsg(name, text) {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat('efault', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date())
  }
}

// User functions
function activateUser(id, name, room) {
  const user = { id, name, room }
  UsersState.setUsers([...UsersState.users.filter((user) => user.id !== id), user])
  console.log(UsersState)
  return user
}

function userLeavesApp(id) {
  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id))
}

function getUser(id) {
  return UsersState.users.find((user) => user.id === id)
}

function getUserInRoom(room) {
  return UsersState.users.filter((user) => user.room === room)
}

function getAllActiveRoom() {
  return Array.from(new Set(UsersState.users.map((user) => user.room)))
}
