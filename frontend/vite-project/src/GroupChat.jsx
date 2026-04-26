import { useState, useEffect, useRef } from "react";
import { connectionWS } from "./connectWS";
import EmojiPicker from "emoji-picker-react";
import { useParams, useLocation,useNavigate  } from "react-router-dom";



const SERVER = "http://localhost:3000";

export default function GroupChat() {

  const location = useLocation();
  const groupName = location.state?.groupName || "Group";


  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typers, setTypers] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { groupId } = useParams();
  const [roomMembers, setRoomMembers] = useState([]);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();



  useEffect(() => {
  const storedName = localStorage.getItem("name");
  setUsername(storedName || "User_" + Math.floor(Math.random() * 10000));
}, []);

  const leaveGroup = async () => {
    try {
      const res = await fetch("http://localhost:3000/group/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userId: localStorage.getItem("_id") }),
      });
      if (res.ok) navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Fetch old messages + normalize sender/receiver
  useEffect(() => {
    if (!groupId || !username) return;

    fetch(`${SERVER}/messages/${groupId}`)
      .then((res) => res.json())
      .then((data) => {

        setMessages(data);
      })
      .catch(console.error);
  }, [groupId, username]);

  // ✅ Socket connection (runs only once after username ready)
  useEffect(() => {
    if (!username) return;

    const newSocket = connectionWS();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinGroup", {
        username,
        groupId,
      });
    });

    newSocket.on("joinNotice", (uname) => {
      setMessages((prev) => [
        ...prev,
        {
          text: `${uname} joined the room`,
          category: "joined",
          time: Date.now(),
        },
      ]);

      setRoomMembers((prev) =>
        prev.includes(uname) ? prev : [...prev, uname]
      );
    });

    newSocket.on("roomMembers", (members) => {
      setRoomMembers(members);
    });

    // ✅ Normalize incoming messages
    newSocket.on("chatMessage", (msg) => {
      setMessages((prev) => {
        const exists = prev.find(
          (m) =>
            m.time === msg.time &&
            m.username === msg.username &&
            m.text === msg.text
        );
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on("typing", (uname) => {
      setTypers((prev) =>
        prev.includes(uname) ? prev : [...prev, uname]
      );
    });

    newSocket.on("stopTyping", (uname) => {
      setTypers((prev) => prev.filter((u) => u !== uname));
    });

    return () => newSocket.disconnect();
  }, [username, groupId]);

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Typing indicator
  useEffect(() => {
    if (!socket || !username) return;

    if (message) socket.emit("typing", username);

    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      socket.emit("stopTyping", username);
    }, 1000);
  }, [message, socket, username]);

  // ✅ File upload
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${SERVER}/postfile`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    return res.json();
  };

  // ✅ Send message
  const handleSend = async () => {
    if (!socket) return;

    const hasText = message.trim().length > 0;
    const hasFile = !!file;

    if (!hasText && !hasFile) return;

    let fileData = { fileUrl: null, fileType: null };

    if (hasFile) {
      setUploading(true);
      try {
        fileData = await uploadFile();
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }

    const msg = {
      username,
      groupId,
      time: Date.now(),
      text: hasText ? message.trim() : "",
      ...fileData,
    };

    // ✅ Optimistic UI (already normalized)
    setMessages((prev) => {
      const exists = prev.find(
        (m) =>
          m.time === msg.time &&
          m.username === msg.username &&
          m.text === msg.text
      );
      if (exists) return prev;
      return [...prev, msg];
    });

    socket.emit("chatMessage", msg);
    socket.emit("stopTyping", username);

    setMessage("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend =
    (message.trim().length > 0 || !!file) && !uploading;

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const renderAttachment = (msg) => {
    if (!msg.fileUrl) return null;
    const url = `${SERVER}${msg.fileUrl}`;
    if (msg.fileType?.startsWith("image/")) {
      return <img src={url} alt="attachment" className="max-w-full rounded-lg mb-1 max-h-48 object-cover" />;
    }
    if (msg.fileType?.startsWith("video/")) {
      return <video src={url} controls className="max-w-full rounded-lg mb-1 max-h-48" />;
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-violet-300 underline mb-1">
        📎 {msg.fileUrl.split("/").pop()}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-[#07091a] flex items-center justify-center p-1 md:p-4">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Chat container */}
      <div className="relative w-full md:w-[80%] h-screen md:h-[88vh] max-h-[820px] flex flex-col rounded-3xl border border-violet-900/30 bg-[#0c0f28]/90 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden">

        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* ── HEADER ── */}
        <header className="relative flex items-center gap-4 px-6 py-4 border-b border-violet-900/25 bg-[#0e1230]/70 shrink-0">
          <div className="relative flex -space-x-2 shrink-0">
            {roomMembers.slice(0, 3).map((name, i) => {
              const colors = ["bg-violet-500", "bg-indigo-500", "bg-blue-500"];
              return (
                <div
                  key={i}
                  style={{ zIndex: 3 - i }}
                  className={`w-8 h-8 rounded-full ${colors[i]} border-2 border-[#0e1230] flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              );
            })}

            {roomMembers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-[#1a1d40] border-2 border-[#0e1230] flex items-center justify-center text-violet-400 text-[10px] font-bold z-0">
                +{roomMembers.length - 3}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-tight truncate">{groupName}</h1>
            {typers.length > 0 && (
              <p className="text-violet-400/70 text-xs mt-0.5">
                {roomMembers.join(", ")} {roomMembers.length === 1 ? "is" : "are"} typing...
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>

          <button
            onClick={leaveGroup}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Leave group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
        </header>

        {/* ── MESSAGES ── */}
        <main className="flex-1 overflow-y-auto px-4 py-5">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3 select-none">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <p className="text-violet-300/50 text-sm font-medium">No messages yet</p>
              <p className="text-violet-400/30 text-xs">Be the first to say something!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isSent = msg.username === username;
            const isJoined = msg.category === "joined";

            if (isJoined) {
              return (
                <div key={i} className="flex justify-center py-2">
                  <span className="bg-violet-500/10 text-violet-300/60 px-3 py-1 rounded-full text-[11px]">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div key={i} className={`flex mb-3 ${isSent ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[72%] md:max-w-xs rounded-2xl px-3 pt-2 pb-2 ${isSent
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 rounded-br-sm shadow-lg"
                    : "bg-[#1a1d40] border border-violet-500/10 rounded-bl-sm"
                    }`}
                >
                  <p className={`text-[11px] font-semibold mb-0.5 ${isSent ? "text-violet-200" : "text-violet-400"}`}>
                    {msg.username || "User"}
                  </p>

                  {msg.fileUrl && renderAttachment(msg)}

                  {msg.text && (
                    <p className={`text-sm leading-snug break-words ${msg.fileUrl ? "mt-1.5" : ""} ${isSent ? "text-white" : "text-violet-100"}`}>
                      {msg.text}
                    </p>
                  )}

                  <p className={`text-[10px] mt-1.5 text-right ${isSent ? "text-violet-200/60" : "text-violet-400/60"}`}>
                    {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </main>

        {/* Fade above input */}
        <div className="pointer-events-none h-6 bg-gradient-to-t from-[#0c0f28] to-transparent -mt-6 shrink-0" />

        {/* ── FILE PREVIEW BAR ── */}
        {file && (
          <div className="mx-4 mb-2 flex items-center gap-3 rounded-xl border border-violet-900/30 bg-[#111433] px-3 py-2 shrink-0">
            {file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="h-12 w-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-violet-900/40 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-violet-100 text-xs font-medium truncate">{file.name}</p>
              <p className="text-violet-400/50 text-[10px] mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={clearFile}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-6 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}


        {/* ── INPUT BAR ── */}
        <footer className="px-4 pb-4 shrink-0">
          <div className="flex items-end gap-2 bg-[#111433]/80 border border-violet-900/35 rounded-2xl px-3 py-2.5 focus-within:border-violet-600/50 transition-all duration-300">

            {/* Attach button */}
            <label className="mb-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-violet-400/50 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={handleFileSelect}
              />
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </label>

            {/* Emoji button (decorative) */}
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="mb-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-violet-400/50 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M8 13s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={2.5} strokeLinecap="round" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={2.5} strokeLinecap="round" />
              </svg>
            </button>

            {/* Textarea */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={file ? "Add a caption..." : "Type a message..."}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[#d4cfff] placeholder-violet-500/35 text-sm leading-6 outline-none py-0.5 max-h-32"
              style={{ scrollbarWidth: "none" }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="mb-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed enabled:bg-gradient-to-br enabled:from-violet-600 enabled:to-indigo-600 enabled:hover:from-violet-500 enabled:hover:to-indigo-500 enabled:shadow-[0_0_16px_rgba(139,92,246,0.4)] enabled:hover:scale-105 enabled:active:scale-95 text-white/70 enabled:text-white"
            >
              {uploading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 translate-x-px -translate-y-px" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-center text-violet-500/25 text-[10px] mt-2 tracking-wide">
            Press <span className="text-violet-500/40">Enter</span> to send ·{" "}
            <span className="text-violet-500/40">Shift+Enter</span> for new line
          </p>
        </footer>
      </div>
    </div>
  );
}