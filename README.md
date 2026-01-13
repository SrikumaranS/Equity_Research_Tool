# Generative AI (GenAI)–Based News Article Research Tool

This project is a Generative AI–powered news research application that allows users to analyze online news articles through conversational question answering. The system uses Retrieval-Augmented Generation (RAG) to ensure responses are grounded in actual article content rather than hallucinated information.

Users can create research sessions, add one or two article URLs, and interact with the content using a ChatGPT-style interface while preserving conversation context.

🚀 Features

User authentication with JWT

Create and manage multiple research sessions

Add minimum 1 and maximum 2 article URLs

Dynamic and static webpage content extraction

Conversational question answering (Context-aware)

Session-based chat history

FAISS vector database for semantic search

Secure and scalable architecture

🛠️ Technology Stack
Frontend

HTML5

CSS3

JavaScript (ES6)

Backend

Node.js

Express.js

JWT Authentication

AI Service

Python

FastAPI

LangChain

Cohere LLM

FAISS Vector Store

Selenium (for dynamic pages)

Database

PostgreSQL

📁 Project Structure
Equity_Research_Tool/
│
├── ai_service/
│   ├── main.py
│   ├── schemas.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── app.js
│   └── style.css
│
├── .gitignore
└── README.md

🔹 Prerequisites

Make sure the following are installed:

Python 3.10 or 3.11

Node.js v18+

PostgreSQL

Git

🔹 Step 1: Clone the Repository
git clone https://github.com/USERNAME/Equity_Research_Tool.git
cd Equity_Research_Tool

🔹 Step 2: Setup AI Service (FastAPI)
📁 Navigate to AI Service
cd ai_service

🐍 Create Virtual Environment
python -m venv venv

▶ Activate Virtual Environment

Windows (PowerShell):

venv\Scripts\Activate.ps1


Windows (CMD):

venv\Scripts\activate


Linux / macOS:

source venv/bin/activate

📦 Install Python Dependencies
pip install -r requirements.txt


If requirements.txt is missing:

pip install fastapi uvicorn langchain langchain-community cohere faiss-cpu python-dotenv unstructured selenium

🔐 Configure Environment Variables

Create a .env file inside ai_service:

COHERE_API_KEY=your_cohere_api_key_here

▶ Run AI Service
uvicorn main:app --reload


AI Service will run at:

http://127.0.0.1:8000

🔹 Step 3: Setup Backend Server (Node.js)

Open a new terminal.

📁 Navigate to Backend
cd backend

📦 Install Node Dependencies
npm install

🔐 Configure Backend Environment Variables

Create a .env file inside backend:

DATABASE_URL=postgresql://username:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret

▶ Run Backend Server
node server.js


Backend runs at:

http://localhost:5000

🔹 Step 4: Setup PostgreSQL Database

Run the following SQL commands:

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

🔹 Step 5: Run Frontend
📁 Navigate to Frontend
cd frontend

▶ Open in Browser

Open index.html directly
(or use Live Server extension in VS Code)

▶ Project Run Order (IMPORTANT)

1️⃣ Start AI Service (FastAPI)
2️⃣ Start Backend Server (Node.js)
3️⃣ Open Frontend

🧪 Usage Flow

Register / Login

Create a new research session

Add 1 or 2 article URLs

Click Process Articles

Ask questions in chat

Continue conversation with context

View saved research anytime
