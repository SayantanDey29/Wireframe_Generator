# 🎨 Wireframe Generator

> Transform any website sitemap into AI-generated wireframes — instantly.

Upload a sitemap XML → Get professional wireframes for every page, powered by LangGraph + OpenRouter AI.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square) ![Stack](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square) ![Stack](https://img.shields.io/badge/AI-LangGraph-FF6B35?style=flat-square) ![Stack](https://img.shields.io/badge/LLM-OpenRouter-purple?style=flat-square)

---

## ✨ Features

- **Upload sitemap.xml** → Automatic page detection and hierarchy analysis
- **AI wireframe generation** — LangGraph workflow processes each page intelligently
- **Rich visual output** — SVG wireframes with 15+ section types (hero, navbar, cards, forms, etc.)
- **Interactive editor** — Click any section to edit labels, descriptions, delete sections
- **Grid overview** — See all pages at once with thumbnail previews
- **Export** — Download individual pages as SVG or the full project as JSON
- **Free AI model** — Uses OpenRouter's free tier (no credit card required for free models)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- A free [OpenRouter](https://openrouter.ai) API key

### 1. Get your OpenRouter API Key

1. Visit [openrouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Go to **Keys** → **Create Key**
4. Copy your key

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env and paste your key:
# OPENROUTER_API_KEY=sk-or-v1-xxxxx...
```

### 3. Start everything (one command)

```bash
chmod +x start.sh
./start.sh
```

This will:
- Create a Python virtual environment
- Install all Python dependencies
- Install npm packages
- Start the FastAPI backend on `http://localhost:8000`
- Start the React frontend on `http://localhost:3000`

---

## 🖥 Manual Setup

### Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # Mac/Linux
# venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt pydantic-settings

# Copy and configure .env
cp .env.example .env
# Edit .env with your OpenRouter API key

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend available at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend available at: `http://localhost:3000`

---

## 📖 How to Use

1. **Open** `http://localhost:3000` in your browser
2. **Upload** your `sitemap.xml` file (drag & drop or click to browse)
3. **Preview** the detected pages and set:
   - Site name (e.g. "Acme Corp")
   - Max pages to generate (1–20, default 10)
4. **Click** "Generate Wireframes" and watch the progress
5. **View** your wireframes:
   - Use the left sidebar to navigate between pages
   - **Single view** — zoom in/out, scroll the full page wireframe
   - **Grid view** — see all pages as thumbnails
   - **Click any section** to open the edit panel (rename, describe, delete)
6. **Export**:
   - Download current page as **SVG** (toolbar button)
   - Download full project as **JSON** (sidebar button)

---

## 🔧 Configuration

### `.env` Options

```env
OPENROUTER_API_KEY=sk-or-v1-...        # Required: your OpenRouter key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free   # Free model (default)
```

### Alternative Free Models on OpenRouter

```env
# Mistral 7B (default, good quality)
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free

# Meta Llama 3.1 8B
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Google Gemma 2 9B
OPENROUTER_MODEL=google/gemma-2-9b-it:free
```

---

## 🏗 Architecture

```
wireframe-generator/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entrypoint
│   │   ├── api/
│   │   │   └── routes.py        # REST API endpoints
│   │   ├── core/
│   │   │   └── config.py        # Settings (pydantic-settings)
│   │   ├── models/
│   │   │   └── wireframe.py     # Pydantic data models
│   │   └── services/
│   │       ├── sitemap_parser.py  # XML → SitemapPage objects
│   │       ├── llm_service.py     # LangChain + OpenRouter LLM calls
│   │       ├── workflow.py        # LangGraph state machine
│   │       └── job_store.py       # In-memory job tracking
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── App.js               # Main app with step routing
        ├── components/
        │   ├── UploadStep.jsx   # File upload + preview UI
        │   ├── GeneratingStep.jsx  # Progress + live log UI
        │   ├── ViewerStep.jsx   # Wireframe viewer + editor
        │   └── WireframeCanvas.jsx  # SVG wireframe renderer
        └── utils/
            └── api.js           # Axios API client
```

### LangGraph Workflow

```
sitemap XML
     ↓
parse_sitemap_xml()
     ↓
[page_1, page_2, ..., page_N]
     ↓
LangGraph StateGraph:
  ┌─────────────────────────────┐
  │  process_page_node          │
  │  ─ infer page type/context  │ ←──┐
  │  ─ call LLM via LangChain   │    │
  │  ─ parse JSON wireframe     │    │
  │  ─ update state             │    │
  └────────────┬────────────────┘    │
               ↓                     │
        more pages? ─── yes ─────────┘
               │
              no
               ↓
        WireframeProject
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/parse-preview` | Preview pages in a sitemap XML |
| `POST` | `/api/generate` | Start wireframe generation job |
| `GET` | `/api/status/{job_id}` | Poll job status + progress |
| `GET` | `/api/result/{job_id}` | Fetch completed wireframe project |

---

## 🧩 Wireframe Section Types

The AI can generate these section types:

| Type | Description |
|------|-------------|
| `navbar` | Navigation bar with logo + links |
| `hero` | Large banner with headline + CTA |
| `features` | Feature grid with icons |
| `cards` | Content card grid |
| `form` | Input form (contact, login, etc.) |
| `cta` | Call-to-action banner |
| `testimonials` | Customer review cards |
| `pricing` | Pricing plan comparison |
| `footer` | Site footer with links |
| `sidebar` | Side navigation/filters |
| `stats` | Metric/stat display |
| `accordion` | Expandable FAQ |
| `grid` | Image/product grid |
| `breadcrumb` | Breadcrumb navigation |
| `table` | Data table |
| `tabs` | Tabbed content |
| `pagination` | Page navigation |
| `banner` | Announcement bar |

---

## 🔬 Testing with Sample Sitemap

A sample sitemap is included for testing:

```bash
# Use sample-sitemap.xml at the root of the project
# It models a coffee brand website with 10 pages
```

---

## 🐛 Troubleshooting

**"Failed to start" / API error**
- Verify your `OPENROUTER_API_KEY` in `backend/.env`
- Check the backend terminal for error details
- Free model may have rate limits — wait a moment and retry

**"No pages found in sitemap"**
- Ensure your XML uses standard `<urlset>` + `<url>` + `<loc>` format
- Check the file is valid XML (no BOM, proper encoding)

**Wireframes look generic**
- Try a different free model in `.env` (see model options above)
- Paid models (GPT-4, Claude) produce richer wireframes

**Frontend can't reach backend**
- Make sure backend is running on port 8000
- The frontend proxies `/api` calls to `localhost:8000` via `package.json`

---

## 📄 License

MIT — use freely in personal and commercial projects.
