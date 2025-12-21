import React, { useContext, useEffect, useState, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '🔥',
  '🎉',
  '😊',
  '👏',
  '🙌',
  '💯',
  '✨',
  '🎈',
  '💪',
  '🙏',
];

const Chat = ({ roomId, userId }) => {
  const { participants, chatsContainerOpen, socket } =
    useContext(SocketContext) ?? {};

  const [texts, setTexts] = useState([]);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);

  const reactionPickerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  /* ---------------- FILE ---------------- */

  const handleFileChange = (e) => {
    const selectedFile = e?.target?.files?.[0];
    if (!selectedFile) return;

    if (selectedFile?.size > 2 * 1024 * 1024) {
      alert('File too large (Max 2MB)');
      e.target.value = '';
      return;
    }
    setFile(selectedFile);
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader?.result);
      reader.onerror = reject;
    });

  /* ---------------- SEND ---------------- */

  const sendMsg = async () => {
    if (!textInput && !file) return;

    let filePayload = null;

    if (file) {
      const base64 = await fileToBase64(file);
      filePayload = {
        name: file?.name,
        type: file?.type,
        data: base64,
      };
    }

    const message = {
      id: crypto.randomUUID(),
      sender: userId,
      text: textInput,
      file: filePayload,
      reactions: {},
      createdAt: Date.now(),
    };

    socket?.emit?.('new-chat', { msg: message, roomId });
    setTexts((prev) => [...prev, message]);

    setTextInput('');
    setFile(null);
  };

  /* ---------------- EMOJI ---------------- */

  const addEmojiToInput = (emoji) => {
    setTextInput((prev) => prev + emoji);
  };

  /* ---------------- REACTIONS ---------------- */

  const toggleReaction = (msgId, emoji) => {
    setTexts((prev) =>
      prev?.map((msg) => {
        if (msg?.id !== msgId) return msg;

        const users = msg?.reactions?.[emoji] ?? [];
        const reacted = users?.includes(userId);

        return {
          ...msg,
          reactions: {
            ...msg?.reactions,
            [emoji]: reacted
              ? users?.filter((u) => u !== userId)
              : [...users, userId],
          },
        };
      })
    );

    socket?.emit?.('reaction', { msgId, emoji, userId, roomId });
    setActiveReactionMsgId(null);
  };

  /* ---------------- CLICK OUTSIDE ---------------- */

  useEffect(() => {
    const handler = (e) => {
      if (
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(e.target)
      )
        setActiveReactionMsgId(null);

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest('.emoji-btn')
      )
        setShowEmojiPicker(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ---------------- SOCKET ---------------- */

  useEffect(() => {
    const handler = ({ msg, room }) => {
      if (room === roomId) setTexts((prev) => [...prev, msg]);
    };

    socket?.on?.('new-chat-arrived', handler);
    return () => socket?.off?.('new-chat-arrived', handler);
  }, [socket, roomId]);

  /* ---------------- UI ---------------- */

  return (
    <div
      className="chats-page"
      style={chatsContainerOpen ? { right: '1vw' } : { right: '-25vw' }}
    >
      <div className="chat-header">
        <h3>💬 Chat Room</h3>
        <span className="online-badge">
          {Object.keys(participants || {})?.length} online
        </span>
      </div>
      <hr />

      <div className="chat-container">
        <div className="chat-messages-box">
          {texts?.length ? (
            texts.map((msg) => (
              <div
                key={msg?.id}
                className={`message-wrapper ${
                  msg?.sender === userId ? 'self' : 'other'
                }`}
              >
                <div
                  className="message-body"
                  onClick={() => setActiveReactionMsgId(msg?.id)}
                >
                  <span className="sender-name">
                    {participants?.[msg?.sender] ?? 'Unknown'}
                  </span>

                  {msg?.text && <p className="message">{msg?.text}</p>}

                  {msg?.file &&
                    (msg?.file?.type?.startsWith('image/') ? (
                      <img
                        src={msg?.file?.data}
                        className="message-image"
                        alt=""
                      />
                    ) : (
                      <a href={msg?.file?.data} download>
                        {msg?.file?.name}
                      </a>
                    ))}

                  {/* Reactions */}
                  <div className="reaction-box">
                    {Object.entries(msg?.reactions ?? {}).map(
                      ([emoji, users]) =>
                        users?.length ? (
                          <span
                            key={emoji}
                            className="reaction-bubble"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReaction(msg?.id, emoji);
                            }}
                          >
                            {emoji} {users?.length}
                          </span>
                        ) : null
                    )}
                  </div>

                  {/* Picker */}
                  {activeReactionMsgId === msg?.id && (
                    <div ref={reactionPickerRef} className="reaction-picker">
                      {EMOJIS.map((emoji) => (
                        <span
                          key={emoji}
                          onClick={() => toggleReaction(msg?.id, emoji)}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-messages">No Conversations yet</div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="send-messages-box">
          <div className="input-wrapper">
            {/* FILE PREVIEW (TOP) */}
            {file && (
              <div className="file-preview-top">
                <span>📎</span>
                <span className="file-preview-name">{file?.name}</span>
                <button
                  className="file-preview-close-btn"
                  onClick={() => setFile(null)}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="input-row">
              <input type="file" id="fileInput" onChange={handleFileChange} />
              <label htmlFor="fileInput" className="file-btn">
                <AttachFileIcon />
              </label>

              <button
                className="emoji-btn"
                onClick={() => setShowEmojiPicker((p) => !p)}
              >
                <EmojiEmotionsIcon />
              </button>

              <input
                className="message-input"
                value={textInput}
                onChange={(e) => setTextInput(e?.target?.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
              />

              <button onClick={sendMsg} className="send-btn">
                <SendIcon />
              </button>
            </div>

            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="emoji-picker">
                {EMOJIS.map((emoji) => (
                  <span key={emoji} onClick={() => addEmojiToInput(emoji)}>
                    {emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
