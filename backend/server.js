import express from 'express';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);

const PORT = process.env.PORT || 3500;
const ADMIN = 'Admin';

const app = express();

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const UsersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
};

const io = new Server(expressServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

function buildMsg(name, text, conversation_id = null) {
  return {
    id: uuidv4(),
    name,
    text,
    time: new Intl.DateTimeFormat('efault', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(new Date()),
    conversation_id,
  };
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('message', buildMsg(ADMIN, 'Welcome to the chat !'));

  socket.on('enterRoom', ({ name, room }) => {
    const prevRoom = getUser(socket.id)?.room;

    if (prevRoom) {
      socket.leave(prevRoom);
      socket.broadcast
        .to(prevRoom)
        .emit('message', buildMsg(ADMIN, `${getUser(socket.id).name} left the room`, prevRoom));
    }

    const user = activateUser(socket.id, name, room);

    if (prevRoom) {
      io.to(prevRoom).emit('userList', {
        users: getUserInRoom(prevRoom),
      });
    }

    socket.join(user.room);

    socket.emit('message', buildMsg(ADMIN, `Welcome ${user.name} to the room ${user.room}`, user.room));
    socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} joined the room`, user.room));
    io.to(user.room).emit('userList', {
      users: getUserInRoom(user.room),
    });
    io.emit('roomList', {
      rooms: getAllActiveRoom(),
    });
  });

  socket.on('disconnect', () => {
    const user = getUser(socket.id);
    userLeavesApp(socket.id);

    if (user) {
      io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} left the room`, user.room));
      io.to(user.room).emit('userList', {
        users: getUserInRoom(user.room),
      });
      io.emit('roomList', {
        rooms: getAllActiveRoom(),
      });
    }
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on('message', ({ name, text, conversation_id }) => {
    const room = conversation_id;
    if (room) {
      io.to(room).emit('message', buildMsg(name, text, room));
    }
  });

  socket.on('activity', (name) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      socket.broadcast.to(room).emit('activity', name);
    }
  });
});

function activateUser(id, name, room) {
  const user = { id, name, room };
  UsersState.setUsers([...UsersState.users.filter((user) => user.id !== id), user]);
  console.log(UsersState);
  return user;
}

function userLeavesApp(id) {
  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
}

function getUser(id) {
  return UsersState.users.find((user) => user.id === id);
}

function getUserInRoom(room) {
  return UsersState.users.filter((user) => user.room === room);
}

function getAllActiveRoom() {
  return Array.from(new Set(UsersState.users.map((user) => user.room)));
}
