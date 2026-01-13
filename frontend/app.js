const API_URL = "http://localhost:5000";
const AI_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

let currentSessionId = null;
let chatHistory = [];

/* ---------------- LOGOUT ---------------- */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/* ---------------- CREATE NEW CHAT ---------------- */
async function newChat() {
  const title = prompt("Enter Research Name:");

  if (!title || title.trim().length === 0) {
    alert("Research name is required");
    return;
  }

  const res = await fetch(`${API_URL}/api/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title: title.trim() })
  });

  const data = await res.json();
  currentSessionId = data.session_id;
  chatHistory = [];

  document.getElementById("messages").innerHTML = "";
  showUrlBox();   // 👈 show URL inputs for new research

  loadChats();
}

/* ---------------- LOAD SAVED CHATS ---------------- */
async function loadChats() {
  const res = await fetch(`${API_URL}/api/chats`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const chats = await res.json();
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  chats.forEach(chat => {
    const li = document.createElement("li");
    li.innerText = chat.title;
    li.onclick = () => loadMessages(chat.id);
    list.appendChild(li);
  });
}

/* ---------------- LOAD CHAT MESSAGES ---------------- */
async function loadMessages(sessionId) {
  currentSessionId = sessionId;
  hideUrlBox(); // URLs already processed for existing research

  const res = await fetch(`${API_URL}/api/chats/${sessionId}/messages`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const messages = await res.json();
  chatHistory = messages;

  const container = document.getElementById("messages");
  container.innerHTML = "";

  messages.forEach(m => addMessage(m.role, m.content));
}

/* ---------------- SEND MESSAGE ---------------- */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();

  if (!text || !currentSessionId) {
    alert("Please start a New Research first");
    return;
  }

  addMessage("user", text);
  chatHistory.push({ role: "user", content: text });
  input.value = "";

  const res = await fetch(`${API_URL}/api/chats/${currentSessionId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  addMessage("ai", data.answer);
  chatHistory.push({ role: "ai", content: data.answer });
}

/* ---------------- PROCESS ARTICLE URLs ---------------- */
async function processUrls() {
  if (!currentSessionId) {
    alert("Please create a New Research first");
    return;
  }

  const url1 = document.getElementById("url1").value.trim();
  const url2 = document.getElementById("url2").value.trim();

  if (!url1) {
    alert("At least one URL is required");
    return;
  }

  const urls = [url1];
  if (url2) urls.push(url2);

  const res = await fetch(`${AI_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: String(currentSessionId),
      urls: urls
    })
  });

  const data = await res.json();
  alert(data.status || "Articles processed successfully");

  hideUrlBox(); // 👈 hide after processing
}

/* ---------------- URL BOX HELPERS ---------------- */
function hideUrlBox() {
  const box = document.getElementById("urlBox");
  if (box) box.style.display = "none";
}

function showUrlBox() {
  const box = document.getElementById("urlBox");
  if (box) box.style.display = "block";

  document.getElementById("url1").value = "";
  document.getElementById("url2").value = "";
}

/* ---------------- UI HELPER ---------------- */
function addMessage(role, content) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.innerText = content;
  document.getElementById("messages").appendChild(msg);
}

/* ---------------- INITIAL LOAD ---------------- */
loadChats();
