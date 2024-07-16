import { useEffect, useState } from 'react';
import { MessageType } from 'src/type/MessageType';
import { ConversationType } from 'src/type/ConversationType';
import { useSocket, SocketProvider } from '../../providers/SocketProvider';

const Chat = () => {
  const { onMessage, send } = useSocket();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  messages.map((msg) => { msg.type === "message" && console.log(msg) });


  useEffect(() => {
    onMessage((msg: MessageType) => {
      console.log('Message received:', msg);
      setMessages((prevMessages) => [...prevMessages, msg]);
    });
  }, [onMessage]);

  const sendMessage = () => {
    if (name && message && room) {
      send({ id: Date.now(), type: 'message', content: message, conversation_id: room, author: name, user_id: Date.now() });
      setMessage('');
    }
    console.log('Message sent:', message);
  };

  const enterRoom = () => {
    if (name && room) {
      send({ id: Date.now(), type: 'enterRoom', content: '', conversation_id: room, author: name, user_id: Date.now() });
    }
  };

  return (
    <div>
      <div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" />
        <button onClick={enterRoom}>Enter Room</button>
      </div>
      <div>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
        <button onClick={sendMessage}>Send Message</button>
      </div>
      <div>
        <h2>Chat</h2>
        <ul>
          {messages.map((msg) => (
            msg.type === 'message' && (
              <li key={msg.id}>
                {msg.content}
              </li>
            )
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
