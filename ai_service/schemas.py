from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str        # "user" or "ai"
    content: str


class ProcessRequest(BaseModel):
    session_id: str
    urls: List[str]



class AskRequest(BaseModel):
    session_id: str
    question: str
    chat_history: Optional[List[ChatMessage]] = []


class AskResponse(BaseModel):
    answer: str
    sources: Optional[str] = None
