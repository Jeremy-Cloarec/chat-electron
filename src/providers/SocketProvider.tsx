import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export type MessageType = {
    id: number;
    type: string;
    content: string;
    conversation_id: number | string;
    author: string;
    user_id: number;
};

interface User {
    id: string;
    name: string;
    room: string;
}

interface AppSocketContext {
    socket: Socket | null;
    onMessage: (callback: (message: MessageType) => void) => void;
    send: (message: MessageType) => void;
    enterRoom: (name: string, room: string) => void;
    onRoomList: (callback: (rooms: string[]) => void) => void;
    onUserList: (callback: (users: User[]) => void) => void;
    onActivity: (callback: (name: string) => void) => void;
    activity: (name: string) => void;
}

const SocketContext = createContext<AppSocketContext | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io('ws://localhost:3500', {
            withCredentials: false,
            extraHeaders: {
                "my-custom-header": "abcd"
            }
        });
        setSocket(newSocket);
        console.log('Socket connected');

        setSocket(newSocket);
        console.log('Socket connected');

        const handleConnect = () => {
            console.log(`Connected with socket id: ${newSocket.id}`);
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
        };

        newSocket.on('connect', handleConnect);
        newSocket.on('disconnect', handleDisconnect);

    }, []);

    const onMessage = (callback: (message: MessageType) => void) => {
        if (!socket) return;
        socket.on('message', callback);
        console.log('Socket message event listener added');
    };

    const send = (message: MessageType) => {
        if (!socket) return;
        socket.emit('message', message);
        console.log('Socket message sent', message);
    };

    const enterRoom = (name: string, room: string) => {
        if (!socket) return;
        socket.emit('enterRoom', { name, room });
        console.log(`Entered room: ${room} as ${name}`);
    };

    const onRoomList = (callback: (rooms: string[]) => void) => {
        if (!socket) return;
        socket.on('roomList', ({ rooms }) => {
            callback(rooms);
            console.log('Room list updated', rooms);
        });
    };

    const onUserList = (callback: (users: User[]) => void) => {
        if (!socket) return;
        socket.on('userList', ({ users }) => {
            callback(users);
            console.log('User list updated', users);
        });
    };

    const onActivity = (callback: (name: string) => void) => {
        if (!socket) return;
        socket.on('activity', callback);
        console.log('Activity event listener added');
    };

    const activity = (name: string) => {
        if (!socket) return;
        socket.emit('activity', name);
        console.log(`Activity sent for ${name}`);
    };


    return (
        <SocketContext.Provider value={{ socket, onMessage, send, enterRoom, onRoomList, onUserList, onActivity, activity }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
