# MiroBridge

AI-powered tool that converts messy Miro boards into polished PowerPoint presentations.

## Features

- 🔗 **Miro OAuth Integration** - Connect directly to your Miro account
- 🤖 **AI Summarization** - Claude AI transforms sticky notes into professional slide content
- 🎨 **Premium Themes** - Modern Midnight (dark) and Professional (light) templates
- 📊 **PowerPoint Export** - One-click PPTX download with speaker notes
- ✏️ **Inline Editing** - Edit titles and bullets before exporting
- 📜 **Export History** - Track your recent exports (stored locally)

## Project Structure

```
miro-bridge/
├── src/                    # React frontend source
│   ├── components/         # UI components
│   ├── pages/              # Page components
│   └── ...
├── public/                 # Static assets
├── backend/                # FastAPI backend
│   ├── server.py           # Main API server
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Backend environment variables
├── package.json            # Frontend dependencies
├── vercel.json             # Vercel deployment config
└── README.md
```

## Deployment

### Option 1: Vercel (Frontend Only)

1. **Fork/Clone this repo**

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Vercel will auto-detect the configuration

3. **Set Environment Variable:**
   - `REACT_APP_BACKEND_URL` = Your backend URL (see Option 2 for backend)

4. **Deploy!**

### Option 2: Backend Deployment (Railway/Render)

Since Vercel only hosts the frontend, deploy the backend separately:

**Railway:**
```bash
cd backend
railway init
railway up
```

**Render:**
1. Create new Web Service on render.com
2. Point to the `backend` folder
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

**Environment Variables for Backend:**
```
MONGO_URL=mongodb+srv://your-mongodb-url
DB_NAME=mirobridge
EMERGENT_LLM_KEY=your-key (or get from Emergent)
MIRO_CLIENT_ID=your-miro-client-id
MIRO_CLIENT_SECRET=your-miro-client-secret
MIRO_REDIRECT_URI=https://your-frontend-url.vercel.app/api/miro/callback
```

### Option 3: Full-Stack on Emergent (Easiest)

1. Click **Deploy** in Emergent
2. Done! Both frontend and backend are handled automatically.

## Local Development

### Frontend
```bash
yarn install
yarn start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

## Tech Stack

- **Frontend:** React, Tailwind CSS, shadcn/ui, PptxGenJS
- **Backend:** FastAPI, Motor (MongoDB)
- **AI:** Claude Sonnet 4.5 via Emergent Integrations
- **Auth:** Miro OAuth 2.0

## License

MIT
