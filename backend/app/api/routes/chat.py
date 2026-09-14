from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter()


@router.get(
    "/chat",
    summary="Chat endpoint information",
    description="Provides usage guidance for browser GET requests to /api/chat.",
)
async def chat_info():
    """Friendly information message when the chat endpoint is accessed via GET."""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "endpoint": "/api/chat",
            "method": "POST",
            "description": "BIS Assistant chat endpoint. Submit queries using HTTP POST with JSON body.",
            "interactive_docs": "http://localhost:8000/docs",
            "example_request": {
                "message": "What is the standard for drinking water?",
                "session_id": "test_session_1",
            },
        },
    )


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit query to BIS Assistant",
    description="Accepts user question regarding Indian Standards / BIS services and returns an assistant response.",
)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Async endpoint for BIS Assistant chat interactions."""
    response = await chat_service.generate_response(request)
    return response
