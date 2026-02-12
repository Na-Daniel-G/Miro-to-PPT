from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class StickyNote(BaseModel):
    id: str
    text: str
    x: float
    y: float
    width: float
    height: float
    color: str

class Frame(BaseModel):
    id: str
    title: str
    x: float
    y: float
    width: float
    height: float

class MiroBoard(BaseModel):
    id: str
    name: str
    frames: List[Frame]
    sticky_notes: List[StickyNote]

class SummarizeRequest(BaseModel):
    notes: List[str]
    frame_title: str

class SlideContent(BaseModel):
    title: str
    bullets: List[str]

# Mock Miro Data
MOCK_MIRO_BOARD = MiroBoard(
    id="board-001",
    name="Q1 Strategic Planning Workshop",
    frames=[
        Frame(id="frame-1", title="Goals & Vision", x=0, y=0, width=600, height=400),
        Frame(id="frame-2", title="Key Challenges", x=700, y=0, width=600, height=400),
        Frame(id="frame-3", title="Action Items", x=0, y=500, width=600, height=400),
        Frame(id="frame-4", title="Team Responsibilities", x=700, y=500, width=600, height=400),
    ],
    sticky_notes=[
        # Goals & Vision notes
        StickyNote(id="note-1", text="Increase market share by 25%", x=50, y=50, width=150, height=100, color="yellow"),
        StickyNote(id="note-2", text="Launch mobile app by Q2", x=220, y=50, width=150, height=100, color="yellow"),
        StickyNote(id="note-3", text="Expand to 3 new regions", x=390, y=50, width=150, height=100, color="blue"),
        StickyNote(id="note-4", text="Improve customer NPS to 70+", x=50, y=180, width=150, height=100, color="green"),
        StickyNote(id="note-5", text="Build strategic partnerships", x=220, y=180, width=150, height=100, color="yellow"),
        # Key Challenges notes
        StickyNote(id="note-6", text="Limited engineering resources", x=750, y=50, width=150, height=100, color="pink"),
        StickyNote(id="note-7", text="Competitor pricing pressure", x=920, y=50, width=150, height=100, color="pink"),
        StickyNote(id="note-8", text="Legacy system migration", x=750, y=180, width=150, height=100, color="pink"),
        StickyNote(id="note-9", text="Supply chain uncertainties", x=920, y=180, width=150, height=100, color="yellow"),
        # Action Items notes
        StickyNote(id="note-10", text="Hire 5 senior developers", x=50, y=550, width=150, height=100, color="green"),
        StickyNote(id="note-11", text="Complete security audit", x=220, y=550, width=150, height=100, color="green"),
        StickyNote(id="note-12", text="Set up CI/CD pipeline", x=390, y=550, width=150, height=100, color="blue"),
        StickyNote(id="note-13", text="Conduct user research sprints", x=50, y=680, width=150, height=100, color="green"),
        # Team Responsibilities notes
        StickyNote(id="note-14", text="Product: Roadmap & prioritization", x=750, y=550, width=150, height=100, color="blue"),
        StickyNote(id="note-15", text="Engineering: Technical debt reduction", x=920, y=550, width=150, height=100, color="blue"),
        StickyNote(id="note-16", text="Marketing: Brand refresh campaign", x=750, y=680, width=150, height=100, color="yellow"),
        StickyNote(id="note-17", text="Sales: Enterprise account focus", x=920, y=680, width=150, height=100, color="yellow"),
    ]
)

def map_notes_to_frames(frames: List[Frame], notes: List[StickyNote]) -> dict:
    """Map sticky notes to frames based on x, y coordinates"""
    frame_notes = {frame.id: [] for frame in frames}
    
    for note in notes:
        note_center_x = note.x + note.width / 2
        note_center_y = note.y + note.height / 2
        
        for frame in frames:
            if (frame.x <= note_center_x <= frame.x + frame.width and
                frame.y <= note_center_y <= frame.y + frame.height):
                frame_notes[frame.id].append(note)
                break
    
    return frame_notes

@api_router.get("/")
async def root():
    return {"message": "MiroBridge API - AI-Powered Miro to PowerPoint Export"}

@api_router.get("/board", response_model=MiroBoard)
async def get_mock_board():
    """Get mock Miro board data with frames and sticky notes"""
    return MOCK_MIRO_BOARD

@api_router.get("/board/mapped")
async def get_mapped_board():
    """Get board data with notes mapped to frames"""
    frame_notes = map_notes_to_frames(MOCK_MIRO_BOARD.frames, MOCK_MIRO_BOARD.sticky_notes)
    
    result = []
    for frame in MOCK_MIRO_BOARD.frames:
        notes = frame_notes.get(frame.id, [])
        result.append({
            "frame": frame.model_dump(),
            "notes": [note.model_dump() for note in notes],
            "note_count": len(notes)
        })
    
    return {
        "board_id": MOCK_MIRO_BOARD.id,
        "board_name": MOCK_MIRO_BOARD.name,
        "frames_with_notes": result
    }

@api_router.post("/summarize", response_model=SlideContent)
async def summarize_frame_content(request: SummarizeRequest):
    """Use AI to summarize sticky note content into slide format"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    notes_text = "\n".join([f"- {note}" for note in request.notes])
    
    prompt = f"""You are an expert presentation designer. Analyze the following brainstorm notes from a Miro board frame titled "{request.frame_title}" and create professional slide content.

Notes:
{notes_text}

Return a JSON object with:
1. "title": A professional, concise headline for this slide (max 10 words)
2. "bullets": An array of 3-5 action-oriented bullet points that summarize and synthesize the brainstorm content

Requirements:
- Title should be punchy and capture the essence
- Bullets should be concise (max 15 words each)
- Transform messy brainstorm ideas into clear, professional language
- Focus on actionable insights

Respond ONLY with valid JSON, no markdown or extra text."""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"mirobridge-{uuid.uuid4()}",
            system_message="You are a presentation expert that converts brainstorm notes into professional slide content. Always respond with valid JSON only."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        # Clean response - remove any markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("\n", 1)[1]
        if clean_response.endswith("```"):
            clean_response = clean_response.rsplit("```", 1)[0]
        clean_response = clean_response.strip()
        
        result = json.loads(clean_response)
        
        return SlideContent(
            title=result.get("title", request.frame_title),
            bullets=result.get("bullets", request.notes[:5])
        )
    except Exception as e:
        logger.error(f"AI summarization error: {str(e)}")
        # Fallback: return original content formatted
        return SlideContent(
            title=request.frame_title,
            bullets=request.notes[:5]
        )

@api_router.post("/summarize-all")
async def summarize_all_frames():
    """Summarize all frames in the board"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    frame_notes = map_notes_to_frames(MOCK_MIRO_BOARD.frames, MOCK_MIRO_BOARD.sticky_notes)
    
    results = []
    for frame in MOCK_MIRO_BOARD.frames:
        notes = frame_notes.get(frame.id, [])
        if not notes:
            continue
            
        notes_text = [note.text for note in notes]
        
        try:
            request = SummarizeRequest(notes=notes_text, frame_title=frame.title)
            slide_content = await summarize_frame_content(request)
            
            results.append({
                "frame_id": frame.id,
                "frame_title": frame.title,
                "slide": slide_content.model_dump(),
                "raw_notes": notes_text
            })
        except Exception as e:
            logger.error(f"Error summarizing frame {frame.id}: {str(e)}")
            results.append({
                "frame_id": frame.id,
                "frame_title": frame.title,
                "slide": {"title": frame.title, "bullets": notes_text[:5]},
                "raw_notes": notes_text
            })
    
    return {
        "board_name": MOCK_MIRO_BOARD.name,
        "slides": results
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
