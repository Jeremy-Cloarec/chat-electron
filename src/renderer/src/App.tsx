import { useState, useEffect } from 'react';
import { MessageType } from 'src/type/MessageType';
import { useSocket, SocketProvider } from '../../providers/SocketProvider';

const Chat = () => {
  const { enterRoom, send, onMessage, onActivity, activity, onRoomList } = useSocket();
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);

  useEffect(() => {
    onRoomList((rooms) => {
      setRooms(rooms);
    });
  }, [onRoomList]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    enterRoom(name, room);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      send({ id: Date.now(), type: 'message', content: message, conversation_id: room, author: name, user_id: Date.now() });
      setMessage('');
    }
  };

  const handleTyping = () => {
    activity(name);
  };

  onMessage((msg) => {
    console.log(msg);
  });

  onActivity((name) => {
    console.log(`${name} is typing...`);
  });

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
            <li key={index}>Rooms : {room}</li>
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
