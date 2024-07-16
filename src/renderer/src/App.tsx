
import { useSocket } from '../../providers/SocketProvider';
import { useEffect, useState } from "react";
import { Conversation } from "../../type/Conversation";

function App(): JSX.Element {
  const hello = "Hello, Electron!"

  return (
    <>
      <h1>{hello}</h1>
    </>
  )
}

export default App
