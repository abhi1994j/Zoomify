import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const Chat = ({ roomId, userId }) => {
  const { participants, chatsContainerOpen, socket } =
    useContext(SocketContext);
  const [texts, setTexts] = useState([]);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');

  // const sendMsg = async () => {
  //   if (!textInput && !file) return;
  //   let fileData = null;
  //   if (file) {
  //     fileData = await fileToBase64(file);
  //   }
  //   await socket.emit('new-chat', {
  //      msg: [userId, textInput ,fileData], roomId: roomId
  //   });
  //   // await socket.emit('new-chat', { msg: [userId, textInput], roomId: roomId });
  //   setTexts((current) => [...current, [userId, textInput , fileData]]);
  //   console.log('sentt');
  //   setTextInput('');
  //   setFile(null);
  // };

  const sendMsg = async () => {
    if (!textInput && !file) return;
    let filePayload = null;

    if (file) {
       const base64 = await fileToBase64(file);
        filePayload = {
         name: file.name,
         type: file.type,
         data: base64,
       };
    }

    const message = {
      sender: userId,
      text: textInput,
      file: filePayload,
    };

    socket.emit('new-chat', { msg: message, roomId });

    setTexts((prev) => [...prev, message]);

    setTextInput('');
    setFile(null);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  // useEffect(() => {
  //   socket.on('new-chat-arrived', async ({ msg, room }) => {
  //     console.log('newwww');
  //     if (room === roomId) {
  //       setTexts((current) => [...current, msg]);
  //     }
  //     console.log('textss', texts);
  //   });
  // }, [socket]);

  useEffect(() => {
    const handler = ({ msg, room }) => {
      if (room === roomId) {
        setTexts((prev) => [...prev, msg]);
      }
    };

    socket.on('new-chat-arrived', handler);

    return () => socket.off('new-chat-arrived', handler);
  }, [socket, roomId]);

  return (
    <div
      className="chats-page"
      style={chatsContainerOpen ? { right: '1vw' } : { right: '-25vw' }}
    >
      <h3>Chat Room..</h3>
      <hr id="h3-hr" />

      <div className="chat-container">
        <div className="chat-messages-box">
          {texts.length > 0 ?
            texts.map((msg, id) => {
              console.log(msg)
              return (
                <div className="message-body" key={id}>
                  <span className="sender-name">
                    {participants[msg.sender]}
                  </span>

                  {msg?.text && <p className="message">{msg.text}</p>}

                  {msg?.file ? (
                    msg.file.type?.startsWith('image/') ? (
                      <img
                        src={msg?.file.data}
                        alt={msg?.file.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <a
                        href={msg?.file.data}
                        download={msg?.file.name}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: '#076993',
                          textDecoration: 'none',
                        }}
                      >
                        📎 {msg?.file.name}
                      </a>
                    )
                  ) : null}
                </div>
              );
            }
          ) : (
            <p>no chats</p>
          )}
        </div>
        <div className="send-messages-box">
          <input
            type="file"
            id="fileInput"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label htmlFor="fileInput">
            <AttachFileIcon />
          </label>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button onClick={sendMsg}>
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
