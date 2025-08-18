"use client";
import { useState } from "react";

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    { sender: "system", text: "Hi! I am your AI assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setLoading(true);
    // Replace with GPT API or rule-based logic
    let response = "(Demo) Sorry, I can't answer that yet.";
    if (input.toLowerCase().includes("75%")) {
      response = "You need to attend 3 more classes to reach 75%.";
    } else if (input.toLowerCase().includes("< 50% attendance")) {
      response = "Students with < 50% attendance: John, Priya, Alex.";
    } else if (input.toLowerCase().includes("monthly attendance report")) {
      response = "Monthly attendance report generated for CSE-3rd Year.";
    }
    setTimeout(() => {
      setMessages((msgs) => [...msgs, { sender: "system", text: response }]);
      setLoading(false);
    }, 1200);
    setInput("");
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">AI Assistant / Chatbot</h2>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4 h-64 overflow-y-auto flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`text-sm p-2 rounded-lg ${msg.sender === "user" ? "bg-green-200 self-end" : "bg-purple-200 self-start"}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400">AI is typing...</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          aria-label="Chat input"
        />
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition-colors duration-200"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
