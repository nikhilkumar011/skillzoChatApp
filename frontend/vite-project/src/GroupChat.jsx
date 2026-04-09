import { useState, useEffect, useRef } from "react";
import { connectionWS } from './connectWS';


export default function GroupChat() {
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const bottomRef = useRef(null);
  const [typers, setTypers] = useState([]);
  const [file,setFile] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const name = prompt("enter your name");
    setUsername(name);
    const newSocket = connectionWS();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('joinGroup', name);
      newSocket.emit('joinNotice', name);
    });

    newSocket.on('joinNotice', (username) => {
      setMessages((prev) => [...prev, { text: `${username} joined the group`, category: "joined", time: Date.now() }]);
    })

    newSocket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, { ...msg, category: "received" }]);
    })

    newSocket.on('typing', (username) => {
      setTypers((prev) => {
        if (prev.includes(username)) return prev;
        return [...prev, username];
      });
    });

    newSocket.on('stopTyping', (username) => {
      setTypers((prev) => prev.filter((user) => user !== username));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    if (message) {
      socket.emit('typing', username);
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      socket.emit('stopTyping', username);
    }, 1000);


  }, [message, username, socket]);


  const handleSend = () => {
    const msg = {
      username,
      time: Date.now(),
      text: message,
      category: "sent"
    }
    setMessages((prev) => [...prev, msg]);
    socket.emit('chatMessage', msg);
    socket.emit('stopTyping', username);
    if (message.trim()) setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#07091a] flex items-center justify-center p-1 md:p-4">
      {/* Ambient background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Chat Container */}
      <div className="relative w-full md:w-[80%] h-screen md:h-[88vh] max-h-[820px] flex flex-col rounded-3xl border border-violet-900/30 bg-[#0c0f28]/90 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(120,90,255,0.06)] overflow-hidden">

        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* ── HEADER ── */}
        <header className="relative flex flex-col md:flex-row items-center gap-4 px-6 py-5 border-b border-violet-900/25 bg-[#0e1230]/70 shrink-0">
          {/* Avatar cluster */}
          <div className="relative flex -space-x-2 shrink-0">
            {["bg-violet-500", "bg-indigo-500", "bg-blue-500"].map((color, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${color} border-2 border-[#0e1230] flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                style={{ zIndex: 3 - i }}
              >
                {["A", "B", "C"][i]}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-[#1a1d40] border-2 border-[#0e1230] flex items-center justify-center text-violet-400 text-[10px] font-bold z-0">
              +9
            </div>
          </div>

          {/* Title & subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight tracking-tight truncate">
              Design Team
            </h1>
            {typers.length !== 0 && (<p className="text-violet-400/70 text-xs mt-0.5">{typers.join(',')} is typing...</p>)}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── CHAT WINDOW ── */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Empty state */}

          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-4 select-none">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                <svg className="w-7 h-7 text-violet-400/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-violet-300/50 text-sm font-medium">No messages yet</p>
                <p className="text-violet-400/30 text-xs mt-1">Be the first to say something!</p>
              </div>
            </div>
          )}

          {messages.length !== 0 &&
            messages.map((each, index) => {
              const isSent = each.category === "sent";
              const isReceived = each.category === "received";
              const isJoined = each.category === "joined";

              return (
                <div
                  key={index}
                  className={`mb-4 flex ${isSent
                    ? "justify-end"
                    : isReceived
                      ? "justify-start"
                      : "justify-center"
                    }`}
                >
                  <div
                    className={`max-w-xs ${isSent &&
                      "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2 shadow-lg"
                      }
          ${isReceived &&
                      "bg-[#1a1d40] text-violet-100 rounded-2xl rounded-bl-sm px-4 py-2 border border-violet-500/10"
                      }
          ${isJoined &&
                      "bg-violet-500/10 text-violet-300 px-3 py-1 rounded-full text-xs"
                      }`}
                  >
                    {(isSent || isReceived) && (
                      <p
                        className={`text-xs font-semibold mb-1 ${isSent ? "text-violet-200" : "text-violet-400"
                          }`}
                      >
                        {each.username || "User"}
                      </p>
                    )}

                    <p className="text-sm leading-snug break-words">
                      {each.text}
                    </p>


                    {(isSent || isReceived) && (
                      <p
                        className={`text-[10px] mt-1 text-right ${isSent ? "text-violet-200/70" : "text-violet-400/70"
                          }`}
                      >
                        {new Date(each.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          <div ref={bottomRef} />

        </main>

        {/* Fade gradient above input */}
        <div className="pointer-events-none h-8 bg-gradient-to-t from-[#0c0f28] to-transparent -mt-8 shrink-0" />

        {/* ── INPUT BAR ── */}
        <footer className="px-4 pb-4 shrink-0">
          <div className="flex items-end gap-2 bg-[#111433]/80 border border-violet-900/35 rounded-2xl px-3 py-2.5 shadow-[0_0_0_1px_rgba(139,92,246,0.04)] focus-within:border-violet-600/50 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)] transition-all duration-300">

            {/* Attachment */}
            <button className="mb-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-violet-400/50 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Emoji */}
            <button className="mb-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-violet-400/50 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200">
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
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[#d4cfff] placeholder-violet-500/35 text-sm leading-6 outline-none py-0.5 max-h-32"
              style={{ scrollbarWidth: "none" }}
            />

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="mb-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed enabled:bg-gradient-to-br enabled:from-violet-600 enabled:to-indigo-600 enabled:hover:from-violet-500 enabled:hover:to-indigo-500 enabled:shadow-[0_0_16px_rgba(139,92,246,0.4)] enabled:hover:scale-105 enabled:active:scale-95 text-white/70 enabled:text-white"
            >
              <svg className="w-3.5 h-3.5 translate-x-px -translate-y-px" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
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