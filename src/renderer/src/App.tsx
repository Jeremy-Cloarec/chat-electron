import { useState, useEffect } from 'react';
import { useSocket, SocketProvider } from '../../providers/SocketProvider';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../type/Message';

const Chat = () => {
  const { enterRoom, send, onMessage, onActivity, activity, onRoomList } = useSocket();
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    onRoomList((rooms) => {
      setRooms(rooms);
    });
  }, [onRoomList]);

  useEffect(() => {
    const handleMessage = (msg: Message) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };

    onMessage(handleMessage);
    return () => {
      // Cleanup listener when component unmounts or onMessage changes
      onMessage(() => { });
    };
  }, [onMessage]);

  useEffect(() => {
    const handleActivity = (name: string) => {
      console.log(`${name} is typing...`);
    };

    onActivity(handleActivity);
    return () => {
      // Cleanup listener when component unmounts or onActivity changes
      onActivity(() => { });
    };
  }, [onActivity]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    enterRoom(name, room);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      const newMessage: Message = {
        id: uuidv4(),
        name,
        text: message,
        time: new Date().toLocaleTimeString(),
        conversation_id: room,
      };
      send(newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]); // Ajout du message localement pour l'afficher immédiatement
      setMessage('');
    }
  };

  const handleTyping = () => {
    activity(name);
  };

  return (
    <div>
      <form onSubmit={handleJoinRoom}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" required />
        <button type="submit">Join Room</button>
      </form>
      <form onSubmit={handleSendMessage}>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" onKeyPress={handleTyping} required />
        <button type="submit">Send Message</button>
      </form>
      <div>
        <h3>Active Rooms</h3>
        <ul>
          {rooms.map((room, index) => (
            <li key={index}>
              <p>Rooms : {room}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Messages</h3>
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.name}</strong>: {msg.text} <em>({msg.time})</em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const App = () => (
  <SocketProvider>
    <Chat />
  </SocketProvider>
);

export default App;
