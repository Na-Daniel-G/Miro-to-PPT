# MiroBridge - Product Requirements Document

## Original Problem Statement
Build "MiroBridge" - a React-based logic handler that:
1. **Data Extraction**: Fetch all frame objects and sticky_note objects from a Miro board
2. **Spatial Logic**: Map sticky notes to frames based on x, y coordinates
3. **AI Summarization Layer**: `summarizeFrameContent(notes[])` using LLM to generate title + 3-5 bullets
4. **PPTX Generation**: Create slides with PptxGenJS, include speaker notes with raw text

## User Personas
- Business professionals converting brainstorm sessions to presentations
- Consultants preparing client deliverables from workshop outputs
- Workshop facilitators needing quick professional exports

## Core Requirements (Static)
- [x] Mock Miro API data (frames + sticky notes)
- [x] Coordinate-based spatial mapping algorithm
- [x] Claude Sonnet 4.5 AI integration via Emergent LLM key
- [x] PptxGenJS browser-compatible export
- [x] Speaker notes with original content

## Implementation Status (Feb 12, 2026)
### Completed
- Backend: FastAPI with mock Miro data (4 frames, 17 notes)
- Frontend: React dashboard with MiroBoard visualization
- AI: Claude integration for summarization
- Export: PPTX generation with slide master template
- UI: Swiss-style professional design with Manrope/Inter fonts

### Architecture
```
Backend (FastAPI):
- GET /api/board - Mock board data
- GET /api/board/mapped - Coordinate-mapped data
- POST /api/summarize - AI summarization endpoint
- POST /api/summarize-all - Bulk processing

Frontend (React):
- Dashboard.jsx - Main orchestration
- MiroBoard.jsx - Board visualization
- SlidePreview.jsx - Generated slide display
- PptxGenJS - Client-side PPTX export
```

## Prioritized Backlog
### P0 (Critical) - DONE
- [x] Core data flow working
- [x] AI summarization functional
- [x] PPTX export working

### P1 (High)
- [ ] Real Miro API integration
- [ ] Custom slide templates
- [ ] Batch export optimization

### P2 (Medium)
- [ ] User settings for AI behavior
- [ ] Multiple export formats (Google Slides, PDF)
- [ ] Board selection UI

## Next Tasks
1. Add real Miro OAuth integration
2. Allow custom slide template selection
3. Add export history/saved exports
