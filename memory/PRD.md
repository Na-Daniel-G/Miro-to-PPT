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

### Phase 1 - MVP Complete
- Backend: FastAPI with mock Miro data (4 frames, 17 notes)
- Frontend: React dashboard with MiroBoard visualization
- AI: Claude integration for summarization
- Export: PPTX generation with slide master template
- UI: Swiss-style professional design with Manrope/Inter fonts

### Phase 2 - Feature Additions Complete
- [x] **Real Miro OAuth Integration**
  - OAuth 2.0 flow with authorization code exchange
  - Board listing and selection
  - Live frame/sticky note fetching
  - Credentials: Client ID 3458764659315953203
- [x] **Professional Slide Template**
  - Dark blue header (#1E3A5F)
  - Blue accent color (#2563EB)
  - White title text
  - Clean body styling
- [x] **Export History (localStorage)**
  - Last 10 exports saved locally
  - Board name, slide count, template, date
  - Clear all functionality
  - Individual delete option

### Architecture
```
Backend (FastAPI):
- GET /api/board - Mock board data
- GET /api/board/mapped - Coordinate-mapped data
- POST /api/summarize - AI summarization endpoint
- POST /api/summarize-all - Bulk processing
- GET /api/templates - Slide templates
- GET /api/miro/status - OAuth status
- GET /api/miro/auth - OAuth redirect
- GET /api/miro/callback - OAuth callback
- GET /api/miro/boards - List user boards
- GET /api/miro/boards/{id} - Get board data

Frontend (React):
- Dashboard.jsx - Main orchestration + Miro OAuth + History
- MiroBoard.jsx - Board visualization
- SlidePreview.jsx - Generated slide display with Professional template
- PptxGenJS - Client-side PPTX export
- localStorage - Export history persistence
```

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core data flow working
- [x] AI summarization functional
- [x] PPTX export working
- [x] Miro OAuth integration
- [x] Professional template
- [x] Export history

### P1 (High) - Future
- [ ] Multiple template selection UI
- [ ] Batch export optimization
- [ ] Persistent user sessions

### P2 (Medium) - Future
- [ ] Google Slides export
- [ ] PDF export option
- [ ] Custom template designer

## Next Tasks
1. Add template selector dropdown for multiple templates
2. Implement persistent Miro auth with refresh tokens
3. Add team collaboration features
