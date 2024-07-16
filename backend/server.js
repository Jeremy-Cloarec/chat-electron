import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin"

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const expressServer = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

// state
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500']
    }
});

io.on('connection', socket => {
    console.log(`Client connected: ${socket.id}`);

    // Upon connection - only to user
    socket.emit('message', buildMsg(ADMIN, 'Welcome to the chat!'));

    socket.on('enterRoom', ({ name, room }) => {
        // Leave previous room
        const prevRoom = getUser(socket.id)?.room;

        if (prevRoom) {
            socket.leave(prevRoom);
            socket.broadcast.to(prevRoom).emit('message', buildMsg(ADMIN, `${getUser(socket.id).name} left the room`));
        }

        const user = activateUser(socket.id, name, room);

        // Cannot update previous room users list until after the state update in activate user
        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUserInRoom(prevRoom)
            });
        }

        // Join new room
        socket.join(user.room);

        // To user who joined
        socket.emit('message', buildMsg(ADMIN, `Welcome ${user.name} to the room ${user.room}`));

        // To all users in the room
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} joined the room`));

        // Update user list for room
        io.to(user.room).emit('userList', {
            users: getUserInRoom(user.room)
        });

        // Update room list
        io.emit('roomList', {
            rooms: getAllActiveRoom()
        });
    })

    // When user disconnects - to all users except the user
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);

        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} left the room`));
            io.to(user.room).emit('userList', {
                users: getUserInRoom(user.room)
            });

            io.emit('roomList', {
                rooms: getAllActiveRoom()
            })
        }
        console.log(`Client disconnected: ${socket.id}`);
    });

    // Listening for messages event
    socket.on('message', ({name, text}) => {
        const room = getUser(socket.id)?.room
        if(room) {
            io.to(room).emit('message', buildMsg(name, text))
        }
    });

    // Listening for activity event
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room
        if (room) {
            socket.broadcast.to(room).emit('activity', name)
        }
    });
});

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

//User functions
// Met à jour ou ajoute un utilisateur
function activateUser(id, name, room) {
    // Création de l'objet user
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    console.log(UsersState);
    return user
}

function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    )
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id)
}

function getUserInRoom(room) {
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRoom() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
}

// 26
// https://www.youtube.com/watch?v=ba4T590JPnw&list=PL0Zuz27SZ-6NOkbTDxKi7grs_oxJhLu07&index=5