import React, { useContext, useEffect, useState, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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

  // ✅ NEW: Edit/Delete states
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);

  // ✅ NEW: Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // ✅ NEW: Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const reactionPickerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messageBoxRef = useRef(null);
  const menuRef = useRef(null);

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
      status: 'sent',
      createdAt: Date.now(),
      edited: false, // ✅ NEW
      deleted: false, // ✅ NEW
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

  /* ✅ NEW: EDIT MESSAGE ---------------- */

  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditText(msg.text);
    setActiveMenuMsgId(null);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;

    setTexts((prev) =>
      prev.map((msg) =>
        msg.id === editingMsgId
          ? { ...msg, text: editText, edited: true }
          : msg
      )
    );

    socket?.emit?.('edit-message', {
      msgId: editingMsgId,
      newText: editText,
      roomId,
    });

    setEditingMsgId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  /* ✅ NEW: DELETE MESSAGE ---------------- */

  const deleteMessage = (msgId) => {
    setTexts((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, deleted: true, text: 'This message was deleted' }
          : msg
      )
    );

    socket?.emit?.('delete-message', { msgId, roomId });
    setActiveMenuMsgId(null);
  };

  /* ✅ NEW: VOICE RECORDING ---------------- */

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await fileToBase64(audioBlob);

        const message = {
          id: crypto.randomUUID(),
          sender: userId,
          text: '',
          voice: {
            data: base64,
            duration: recordingTime,
          },
          reactions: {},
          status: 'sent',
          createdAt: Date.now(),
          edited: false,
          deleted: false,
        };

        socket?.emit?.('new-chat', { msg: message, roomId });
        setTexts((prev) => [...prev, message]);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  /* ✅ NEW: PAGINATION / INFINITE SCROLL ---------------- */

  const loadMoreMessages = () => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simulate loading more messages (replace with actual socket call)
    setTimeout(() => {
      socket?.emit?.('load-messages', { roomId, page: page + 1 });
      setPage((prev) => prev + 1);
      setLoading(false);
    }, 500);
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;

    // Load more when scrolled to top
    if (scrollTop === 0) {
      loadMoreMessages();
    }
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

      if (menuRef.current && !menuRef.current.contains(e.target))
        setActiveMenuMsgId(null);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ---------------- SOCKET (RECEIVE + READ RECEIPTS) ---------------- */

  useEffect(() => {
    const handler = ({ msg, room }) => {
      if (room !== roomId) return;

      setTexts((prev) => [...prev, { ...msg, status: 'delivered' }]);

      socket?.emit?.('read', { msgId: msg?.id, roomId, userId });
    };

    socket?.on?.('new-chat-arrived', handler);
    return () => socket?.off?.('new-chat-arrived', handler);
  }, [socket, roomId, userId]);

  /* ---------------- READ RECEIPT LISTENER ---------------- */

  useEffect(() => {
    const handler = ({ msgId }) => {
      setTexts((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, status: 'seen' } : msg))
      );
    };

    socket?.on?.('read', handler);
    return () => socket?.off?.('read', handler);
  }, [socket]);

  /* ✅ NEW: EDIT MESSAGE LISTENER ---------------- */

  useEffect(() => {
    const handler = ({ msgId, newText }) => {
      setTexts((prev) =>
        prev.map((msg) =>
          msg.id === msgId ? { ...msg, text: newText, edited: true } : msg
        )
      );
    };

    socket?.on?.('edit-message', handler);
    return () => socket?.off?.('edit-message', handler);
  }, [socket]);

  /* ✅ NEW: DELETE MESSAGE LISTENER ---------------- */

  useEffect(() => {
    const handler = ({ msgId }) => {
      setTexts((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, deleted: true, text: 'This message was deleted' }
            : msg
        )
      );
    };

    socket?.on?.('delete-message', handler);
    return () => socket?.off?.('delete-message', handler);
  }, [socket]);

  /* ✅ NEW: LOAD MORE MESSAGES LISTENER ---------------- */

  useEffect(() => {
    const handler = ({ messages, hasMore: more }) => {
      setTexts((prev) => [...messages, ...prev]);
      setHasMore(more);
    };

    socket?.on?.('messages-loaded', handler);
    return () => socket?.off?.('messages-loaded', handler);
  }, [socket]);

  /* ---------------- UI ---------------- */

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        <div
          className="chat-messages-box"
          ref={messageBoxRef}
          onScroll={handleScroll}
        >
          {loading && (
            <div className="loading-more">Loading more messages...</div>
          )}

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
                  onClick={() => setActiveReactionMsgId(msg.id)}
                >
                  <div className="message-header">
                    <span className="sender-name">
                      {participants?.[msg?.sender] ?? 'Unknown'}
                    </span>

                    {/* ✅ NEW: Menu button (only for own messages) */}
                    {msg?.sender === userId && !msg?.deleted && (
                      <button
                        className="message-menu-btn"
                        onClick={() =>
                          setActiveMenuMsgId(
                            activeMenuMsgId === msg.id ? null : msg.id
                          )
                        }
                      >
                        <MoreVertIcon style={{ fontSize: '16px' }} />
                      </button>
                    )}

                    {/* ✅ NEW: Menu dropdown */}
                    {activeMenuMsgId === msg.id && (
                      <div ref={menuRef} className="message-menu">
                        {msg?.text && (
                          <button onClick={() => startEdit(msg)}>
                            <EditIcon style={{ fontSize: '14px' }} /> Edit
                          </button>
                        )}
                        <button onClick={() => deleteMessage(msg.id)}>
                          <DeleteIcon style={{ fontSize: '14px' }} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ✅ EDIT MODE */}
                  {editingMsgId === msg.id ? (
                    <div className="edit-container">
                      <textarea
                        className="edit-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button className="edit-save-btn" onClick={saveEdit}>
                          Save
                        </button>
                        <button
                          className="edit-cancel-btn"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Regular message display */}
                      {msg?.text && (
                        <p className="message">
                          {msg?.text}
                          {msg?.edited && (
                            <span className="edited-label"> (edited)</span>
                          )}
                        </p>
                      )}

                      {/* ✅ NEW: Voice note player
                      {msg?.voice && (
                        <div className="voice-message">
                          <audio controls src={msg.voice.data}>
                            Your browser does not support audio.
                          </audio>
                          <span className="voice-duration">
                            {formatTime(msg.voice.duration)}
                          </span>
                        </div>
                      )} */}

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
                    </>
                  )}

                  {/* Read receipt */}
                  {msg?.sender === userId && !msg?.deleted && (
                    <span className="read-receipt">
                      {msg?.status === 'seen'
                        ? '✓✓ Seen'
                        : msg?.status === 'delivered'
                        ? '✓ Delivered'
                        : '✓ Sent'}
                    </span>
                  )}

                  {/* Reactions */}
                  {!msg?.deleted && (
                    <>
                      <div
                        className="reaction-box"
                        onClick={() => setActiveReactionMsgId(msg?.id)}
                      >
                        {Object.entries(msg?.reactions ?? {}).map(
                          ([emoji, users]) =>
                            users?.length ? (
                              <span
                                key={emoji}
                                className="reaction-bubble"
                                onClick={(e) => {
                                  e.stopPropagation(); // ✅ ADD
                                  toggleReaction(msg?.id, emoji);
                                }}
                              >
                                {emoji} {users?.length}
                              </span>
                            ) : null
                        )}
                      </div>

                      {activeReactionMsgId === msg?.id && (
                        <div
                          ref={reactionPickerRef}
                          className="reaction-picker"
                          onClick={(e) => e.stopPropagation()} // ✅ ADD THIS
                        >
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
                    </>
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

            {/* ✅ NEW: Recording indicator
            {isRecording && (
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                Recording... {formatTime(recordingTime)}
              </div>
            )} */}

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

              {/* ✅ NEW: Voice recording button
              {!isRecording ? (
                <button className="voice-btn" onClick={startRecording}>
                  <MicIcon />
                </button>
              ) : (
                <button className="voice-btn recording" onClick={stopRecording}>
                  <StopIcon />
                </button>
              )} */}

              <textarea
                className="message-input"
                rows={1}
                value={textInput}
                placeholder="Type a message..."
                onChange={(e) => {
                  setTextInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMsg();
                  }
                }}
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
