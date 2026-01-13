import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from typing import List

from langchain_community.chat_models import ChatCohere
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import SeleniumURLLoader
from langchain_community.embeddings import CohereEmbeddings
from langchain_community.vectorstores import FAISS

from schemas import ProcessRequest, AskRequest, AskResponse

# ---------------------------
# App & Environment Setup
# ---------------------------
load_dotenv()

app = FastAPI(title="AI Research Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "API running"}

# Base FAISS directory
BASE_FAISS_DIR = "faiss_store"

# ---------------------------
# LLM & Embeddings
# ---------------------------
llm = ChatCohere(
    model="command",
    temperature=0.7
)

embeddings = CohereEmbeddings()

# ---------------------------
# API 1: Process URLs (Session-based FAISS)
# ---------------------------
@app.post("/process")
def process_urls(req: ProcessRequest):
    """
    Build FAISS index for a specific chat session
    """

    loader = SeleniumURLLoader(urls=req.urls)
    documents = loader.load()


    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    docs = splitter.split_documents(documents)

    session_dir = os.path.join(BASE_FAISS_DIR, req.session_id)
    os.makedirs(session_dir, exist_ok=True)

    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(session_dir)

    return {"status": "Articles indexed for this session"}

# ---------------------------
# API 2: Ask Question (Conversational RAG)
# ---------------------------
@app.post("/ask", response_model=AskResponse)
def ask_question(req: AskRequest):
    """
    Answer questions using:
    - Session-based FAISS
    - Conversational history
    """

    session_dir = os.path.join(BASE_FAISS_DIR, req.session_id)

    # Ensure articles are processed
    if not os.path.exists(os.path.join(session_dir, "index.faiss")):
        return AskResponse(
            answer="Please process articles before asking questions.",
            sources=""
        )

    # Load FAISS index for this session
    vectorstore = FAISS.load_local(
        session_dir,
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    chain = RetrievalQAWithSourcesChain.from_llm(
        llm=llm,
        retriever=retriever
    )

    # ---------------------------
    # Conversational Memory
    # ---------------------------
    history = req.chat_history[-6:] if req.chat_history else []

    formatted_history = []
    for msg in history:
        formatted_history.append(f"{msg.role}: {msg.content}")

    result = chain(
        {
            "question": req.question,
            "chat_history": formatted_history
        },
        return_only_outputs=True
    )

    return AskResponse(
        answer=result.get("answer", ""),
        sources=result.get("sources", "")
    )
