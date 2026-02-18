from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import json
from groq import AsyncGroq

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (optional)
mongo_url = os.environ.get('MONGO_URL')
if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get('DB_NAME', 'mirobridge')]
        logger = logging.getLogger(__name__)
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.warning(f"MongoDB connection failed: {e}. Continuing without database.")
        client = None
        db = None
else:
    logger = logging.getLogger(__name__)
    logger.info("MONGO_URL not set. Running without database.")
    client = None
    db = None

# Create the main app without a prefix
app = FastAPI()

# Create routers
api_router = APIRouter(prefix="/api")
miro_router = APIRouter(prefix="/api/miro")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Miro OAuth Configuration
MIRO_CLIENT_ID = os.environ.get('MIRO_CLIENT_ID')
MIRO_CLIENT_SECRET = os.environ.get('MIRO_CLIENT_SECRET')
MIRO_REDIRECT_URI = os.environ.get('MIRO_REDIRECT_URI')
MIRO_AUTH_URL = "https://miro.com/oauth/authorize"
MIRO_TOKEN_URL = "https://api.miro.com/v1/oauth/token"
MIRO_API_BASE = "https://api.miro.com/v2"

# Frontend URL for OAuth redirect (can be overridden by query param)
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')

# In-memory token storage (for demo - in production use secure storage)
token_store: Dict[str, Any] = {}

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

class ExportRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    board_name: str
    slide_count: int
    template: str
    exported_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Slide Templates
SLIDE_TEMPLATES = {
    "professional": {
        "name": "Professional",
        "description": "Dark blue header with clean white body",
        "header_color": "1E3A5F",
        "accent_color": "2563EB",
        "title_color": "FFFFFF",
        "body_color": "1F2937",
        "bullet_color": "4B5563",
        "background": "FFFFFF"
    },
    "minimal": {
        "name": "Minimal",
        "description": "Clean white with subtle accents",
        "header_color": "F8FAFC",
        "accent_color": "94A3B8",
        "title_color": "0F172A",
        "body_color": "334155",
        "bullet_color": "64748B",
        "background": "FFFFFF"
    },
    "bold": {
        "name": "Bold",
        "description": "Gradient accent with modern style",
        "header_color": "7C3AED",
        "accent_color": "EC4899",
        "title_color": "FFFFFF",
        "body_color": "1F2937",
        "bullet_color": "6B7280",
        "background": "FFFFFF"
    },
    "corporate": {
        "name": "Corporate",
        "description": "Traditional business presentation",
        "header_color": "1F2937",
        "accent_color": "3B82F6",
        "title_color": "FFFFFF",
        "body_color": "111827",
        "bullet_color": "374151",
        "background": "F9FAFB"
    }
}

# Mock Miro Data (fallback when not connected)
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
        StickyNote(id="note-1", text="Increase market share by 25%", x=50, y=50, width=150, height=100, color="yellow"),
        StickyNote(id="note-2", text="Launch mobile app by Q2", x=220, y=50, width=150, height=100, color="yellow"),
        StickyNote(id="note-3", text="Expand to 3 new regions", x=390, y=50, width=150, height=100, color="blue"),
        StickyNote(id="note-4", text="Improve customer NPS to 70+", x=50, y=180, width=150, height=100, color="green"),
        StickyNote(id="note-5", text="Build strategic partnerships", x=220, y=180, width=150, height=100, color="yellow"),
        StickyNote(id="note-6", text="Limited engineering resources", x=750, y=50, width=150, height=100, color="pink"),
        StickyNote(id="note-7", text="Competitor pricing pressure", x=920, y=50, width=150, height=100, color="pink"),
        StickyNote(id="note-8", text="Legacy system migration", x=750, y=180, width=150, height=100, color="pink"),
        StickyNote(id="note-9", text="Supply chain uncertainties", x=920, y=180, width=150, height=100, color="yellow"),
        StickyNote(id="note-10", text="Hire 5 senior developers", x=50, y=550, width=150, height=100, color="green"),
        StickyNote(id="note-11", text="Complete security audit", x=220, y=550, width=150, height=100, color="green"),
        StickyNote(id="note-12", text="Set up CI/CD pipeline", x=390, y=550, width=150, height=100, color="blue"),
        StickyNote(id="note-13", text="Conduct user research sprints", x=50, y=680, width=150, height=100, color="green"),
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

# ==================== MIRO OAUTH ENDPOINTS ====================

@miro_router.get("/auth")
async def miro_auth(redirect_url: str = Query(None)):
    """Redirect user to Miro OAuth authorization"""
    if not MIRO_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Miro OAuth not configured")
    
    # Store the frontend URL to redirect back to after OAuth
    # Use provided redirect_url, or FRONTEND_URL env var, or empty
    frontend_redirect = redirect_url or FRONTEND_URL or ""
    
    # URL encode the state to preserve it through OAuth
    import urllib.parse
    state = urllib.parse.quote(frontend_redirect, safe='')
    
    auth_url = (
        f"{MIRO_AUTH_URL}?"
        f"response_type=code&"
        f"client_id={MIRO_CLIENT_ID}&"
        f"redirect_uri={MIRO_REDIRECT_URI}&"
        f"scope=boards:read&"
        f"state={state}"
    )
    logger.info(f"OAuth redirect URL stored in state: {frontend_redirect}")
    return RedirectResponse(url=auth_url)

@miro_router.get("/callback")
async def miro_callback(code: str = Query(None), error: str = Query(None), state: str = Query("")):
    """Handle OAuth callback from Miro"""
    import urllib.parse
    
    # Decode the frontend URL from state
    frontend_url = urllib.parse.unquote(state) if state else ""
    logger.info(f"OAuth callback - state decoded to: {frontend_url}")
    
    # Determine final redirect destination
    if frontend_url and frontend_url.startswith("http"):
        base_redirect = frontend_url
    elif FRONTEND_URL and FRONTEND_URL.startswith("http"):
        base_redirect = FRONTEND_URL
    else:
        base_redirect = ""
    
    if error:
        redirect_target = f"{base_redirect}?miro_error={error}" if base_redirect else f"/?miro_error={error}"
        return RedirectResponse(url=redirect_target)
    
    if not code:
        redirect_target = f"{base_redirect}?miro_error=no_code" if base_redirect else "/?miro_error=no_code"
        return RedirectResponse(url=redirect_target)
    
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                MIRO_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": MIRO_CLIENT_ID,
                    "client_secret": MIRO_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": MIRO_REDIRECT_URI
                }
            )
            response.raise_for_status()
            token_data = response.json()
            
            # Store token
            token_store["default"] = {
                "access_token": token_data.get("access_token"),
                "refresh_token": token_data.get("refresh_token"),
                "expires_at": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Miro OAuth successful, redirecting to: {base_redirect}")
            redirect_target = f"{base_redirect}?miro_connected=true" if base_redirect else "/?miro_connected=true"
            return RedirectResponse(url=redirect_target)
    except Exception as e:
        logger.error(f"Miro OAuth error: {str(e)}")
        redirect_target = f"{base_redirect}?miro_error=token_exchange_failed" if base_redirect else "/?miro_error=token_exchange_failed"
        return RedirectResponse(url=redirect_target)

@miro_router.get("/status")
async def miro_status():
    """Check Miro connection status"""
    is_connected = "default" in token_store and token_store["default"].get("access_token")
    return {
        "connected": is_connected,
        "configured": bool(MIRO_CLIENT_ID and MIRO_CLIENT_SECRET)
    }

@miro_router.post("/disconnect")
async def miro_disconnect():
    """Disconnect from Miro"""
    if "default" in token_store:
        del token_store["default"]
    return {"status": "disconnected"}

@miro_router.get("/boards")
async def get_miro_boards():
    """Get list of boards from Miro"""
    if "default" not in token_store:
        raise HTTPException(status_code=401, detail="Not connected to Miro")
    
    access_token = token_store["default"]["access_token"]
    
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"{MIRO_API_BASE}/boards",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            del token_store["default"]
            raise HTTPException(status_code=401, detail="Token expired, please reconnect")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))

@miro_router.get("/boards/{board_id}")
async def get_miro_board_data(board_id: str):
    """Get board data with frames and sticky notes from Miro"""
    if "default" not in token_store:
        raise HTTPException(status_code=401, detail="Not connected to Miro")
    
    access_token = token_store["default"]["access_token"]
    
    try:
        async with httpx.AsyncClient() as http_client:
            # Get board info
            board_response = await http_client.get(
                f"{MIRO_API_BASE}/boards/{board_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            board_response.raise_for_status()
            board_info = board_response.json()
            
            # Fetch ALL items with pagination
            all_items = []
            cursor = None
            
            while True:
                params = {"limit": 50}
                if cursor:
                    params["cursor"] = cursor
                
                items_response = await http_client.get(
                    f"{MIRO_API_BASE}/boards/{board_id}/items",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=params
                )
                items_response.raise_for_status()
                items_data = items_response.json()
                
                all_items.extend(items_data.get("data", []))
                
                cursor = items_data.get("cursor")
                if not cursor:
                    break
            
            logger.info(f"Fetched {len(all_items)} total items from board {board_id}")
            
            # First pass: collect frames and their positions
            frames = []
            frame_map = {}  # id -> frame data with absolute position
            
            for item in all_items:
                item_type = item.get("type")
                if item_type == "frame":
                    frame_id = item["id"]
                    frame_x = item.get("position", {}).get("x", 0)
                    frame_y = item.get("position", {}).get("y", 0)
                    frame_width = item.get("geometry", {}).get("width", 600)
                    frame_height = item.get("geometry", {}).get("height", 400)
                    
                    frame = Frame(
                        id=frame_id,
                        title=item.get("data", {}).get("title", "Untitled Frame"),
                        x=frame_x,
                        y=frame_y,
                        width=frame_width,
                        height=frame_height
                    )
                    frames.append(frame)
                    frame_map[frame_id] = {
                        "frame": frame,
                        "x": frame_x,
                        "y": frame_y,
                        "width": frame_width,
                        "height": frame_height
                    }
            
            logger.info(f"Found {len(frames)} frames")
            
            # Second pass: collect content items and handle parent relationships
            sticky_notes = []
            
            def extract_content(item):
                """Extract text content from various item types"""
                item_type = item.get("type")
                content = ""
                
                if item_type == "sticky_note":
                    content = item.get("data", {}).get("content", "")
                elif item_type == "text":
                    content = item.get("data", {}).get("content", "")
                elif item_type == "shape":
                    content = item.get("data", {}).get("content", "")
                elif item_type == "card":
                    title = item.get("data", {}).get("title", "")
                    desc = item.get("data", {}).get("description", "")
                    content = f"{title}: {desc}" if title and desc else title or desc
                
                # Strip HTML tags
                import re
                return re.sub(r'<[^>]+>', '', content).strip()
            
            def get_color(item):
                """Get color from item style"""
                fill_color = item.get("style", {}).get("fillColor", "yellow")
                color_map = {
                    "light_yellow": "yellow", "yellow": "yellow",
                    "light_blue": "blue", "blue": "blue",
                    "light_green": "green", "green": "green",
                    "light_pink": "pink", "pink": "pink",
                    "violet": "pink", "cyan": "blue", "orange": "yellow",
                    "gray": "yellow", "dark_blue": "blue",
                    "dark_green": "green", "red": "pink"
                }
                return color_map.get(fill_color, "yellow")
            
            for item in all_items:
                item_type = item.get("type")
                
                # Skip frames and non-content items
                if item_type in ["frame", "image", "document", "embed", "preview"]:
                    continue
                
                content = extract_content(item)
                if not content:
                    continue
                
                # Get position - check if item has a parent (is inside a frame)
                parent_id = item.get("parent", {}).get("id") if item.get("parent") else None
                item_x = item.get("position", {}).get("x", 0)
                item_y = item.get("position", {}).get("y", 0)
                
                # If item is inside a frame, its coordinates are RELATIVE to the frame
                # Convert to absolute coordinates for mapping
                if parent_id and parent_id in frame_map:
                    parent_frame = frame_map[parent_id]
                    # Item position is relative to frame center, convert to absolute
                    abs_x = parent_frame["x"] + item_x
                    abs_y = parent_frame["y"] + item_y
                    logger.info(f"Item '{content[:30]}' is child of frame '{parent_frame['frame'].title}', relative pos ({item_x}, {item_y}), absolute ({abs_x}, {abs_y})")
                else:
                    abs_x = item_x
                    abs_y = item_y
                
                sticky_notes.append(StickyNote(
                    id=item["id"],
                    text=content,
                    x=abs_x,
                    y=abs_y,
                    width=item.get("geometry", {}).get("width", 150),
                    height=item.get("geometry", {}).get("height", 100),
                    color=get_color(item)
                ))
                logger.info(f"Added content item: '{content[:50]}' at ({abs_x}, {abs_y})")
            
            logger.info(f"Parsed {len(frames)} frames and {len(sticky_notes)} content items")
            
            # Debug: log frame boundaries
            for frame in frames:
                logger.info(f"Frame '{frame.title}': x={frame.x}, y={frame.y}, w={frame.width}, h={frame.height}")
            
            return MiroBoard(
                id=board_id,
                name=board_info.get("name", "Untitled Board"),
                frames=frames,
                sticky_notes=sticky_notes
            )
    except httpx.HTTPStatusError as e:
        logger.error(f"Miro API error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 401:
            del token_store["default"]
            raise HTTPException(status_code=401, detail="Token expired, please reconnect")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))

# ==================== ORIGINAL ENDPOINTS ====================

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

@api_router.get("/templates")
async def get_templates():
    """Get available slide templates"""
    return {"templates": SLIDE_TEMPLATES}

@api_router.post("/summarize", response_model=SlideContent)
async def summarize_frame_content(request: SummarizeRequest):
    """Use AI to summarize sticky note content into premium editorial slide format"""
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        logger.warning("GROQ_API_KEY not configured, returning basic summary")
        return SlideContent(
            title=request.frame_title,
            bullets=request.notes[:5]
        )
    
    notes_text = "\n".join([f"- {note}" for note in request.notes])
    
    prompt = f"""You are a Digital Product Designer creating premium, editorial-style presentation content. Transform these brainstorm notes from "{request.frame_title}" into curated slide content.

Notes:
{notes_text}

Return a JSON object with:
1. "title": An evocative, poetic headline (max 8 words) - think high-end tech landing page meets premium editorial magazine
2. "bullets": 3-5 concise, impactful bullet points (max 12 words each) - use white space as a design element, avoid corporate clichés
3. "aspirational_insight": A single inspiring takeaway sentence that captures the essence

Requirements:
- Make the content feel CURATED and INTENTIONAL
- Headlines should be evocative, not generic
- Bullets should be punchy and memorable
- Max 30 words total on slide face
- Transform messy brainstorm into premium editorial content

Respond ONLY with valid JSON, no markdown or extra text."""

    try:
        client = AsyncGroq(api_key=api_key)
        
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a premium presentation designer that creates editorial-style, magazine-quality slide content. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content
        
        # Parse the JSON response
        clean_response = response_text.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response.replace("```json", "").replace("```", "").strip()
        elif clean_response.startswith("```"):
            clean_response = clean_response.split("\n", 1)[1]
            clean_response = clean_response.rsplit("```", 1)[0].strip()
        
        result = json.loads(clean_response)
        
        # Combine bullets with aspirational insight if present
        bullets = result.get("bullets", request.notes[:5])
        if result.get("aspirational_insight"):
            bullets.append(f"✦ {result.get('aspirational_insight')}")
        
        return SlideContent(
            title=result.get("title", request.frame_title),
            bullets=bullets
        )
    except Exception as e:
        logger.error(f"AI summarization error: {str(e)}")
        return SlideContent(
            title=request.frame_title,
            bullets=request.notes[:5]
        )

@api_router.post("/summarize-all")
async def summarize_all_frames():
    """Summarize all frames in the board (including empty frames)"""
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        logger.warning("GROQ_API_KEY not configured, using basic summaries")
    
    frame_notes = map_notes_to_frames(MOCK_MIRO_BOARD.frames, MOCK_MIRO_BOARD.sticky_notes)
    
    results = []
    for frame in MOCK_MIRO_BOARD.frames:
        notes = frame_notes.get(frame.id, [])
        notes_text = [note.text for note in notes] if notes else []
        
        # Handle frames with no sticky notes
        if not notes_text:
            results.append({
                "frame_id": frame.id,
                "frame_title": frame.title,
                "slide": {
                    "title": frame.title,
                    "bullets": ["Content to be added"]
                },
                "raw_notes": [],
                "is_empty_frame": True
            })
            continue
        
        try:
            request = SummarizeRequest(notes=notes_text, frame_title=frame.title)
            slide_content = await summarize_frame_content(request)
            
            results.append({
                "frame_id": frame.id,
                "frame_title": frame.title,
                "slide": slide_content.model_dump(),
                "raw_notes": notes_text,
                "is_empty_frame": False
            })
        except Exception as e:
            logger.error(f"Error summarizing frame {frame.id}: {str(e)}")
            results.append({
                "frame_id": frame.id,
                "frame_title": frame.title,
                "slide": {"title": frame.title, "bullets": notes_text[:5]},
                "raw_notes": notes_text,
                "is_empty_frame": False
            })
    
    return {
        "board_name": MOCK_MIRO_BOARD.name,
        "slides": results
    }

# Include routers
app.include_router(api_router)
app.include_router(miro_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info("APPLICATION STARTING UP")
    logger.info(f"GROQ_API_KEY present: {bool(os.environ.get('GROQ_API_KEY'))}")
    logger.info(f"FRONTEND_URL: {os.environ.get('FRONTEND_URL', 'Not set')}")
    logger.info(f"CORS_ORIGINS: {os.environ.get('CORS_ORIGINS', 'Not set')}")
    logger.info(f"MongoDB connected: {db is not None}")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("APPLICATION SHUTTING DOWN")
    if client:
        client.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
