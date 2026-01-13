const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   JWT Middleware
========================= */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* =========================
   TEST
========================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});

/* =========================
   AUTH APIs
========================= */

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hash]
    );

    res.json({ message: "User created", user_id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { user_id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

/* =========================
   CHAT APIs (Protected)
========================= */

// Create new chat
app.post("/api/chats", authMiddleware, async (req, res) => {
  const user_id = req.user.user_id;
  const { title } = req.body;

  const result = await pool.query(
    "INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id",
    [user_id, title || "New Research"]
  );

  res.json({ session_id: result.rows[0].id });
});

// Get saved chats
app.get("/api/chats", authMiddleware, async (req, res) => {
  const user_id = req.user.user_id;

  const result = await pool.query(
    "SELECT id, title FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC",
    [user_id]
  );

  res.json(result.rows);
});

// Get messages of a chat
app.get("/api/chats/:id/messages", authMiddleware, async (req, res) => {
  const session_id = req.params.id;

  const result = await pool.query(
    "SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at",
    [session_id]
  );

  res.json(result.rows);
});

// Send message
app.post("/api/chats/:id/message", authMiddleware, async (req, res) => {
  const session_id = req.params.id;
  const { message } = req.body;

  // Save user message
  await pool.query(
    "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)",
    [session_id, message]
  );

  // Load history
  const historyResult = await pool.query(
    "SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at",
    [session_id]
  );

  // Call AI service
  const aiResponse = await axios.post(process.env.AI_SERVICE_URL, {
    session_id,
    question: message,
    chat_history: historyResult.rows
  });

  const aiAnswer = aiResponse.data.answer;

  // Save AI response
  await pool.query(
    "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'ai', $2)",
    [session_id, aiAnswer]
  );

  // Update timestamp
  await pool.query(
    "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [session_id]
  );

  res.json({ answer: aiAnswer });
});

/* =========================
   START SERVER
========================= */
app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});
