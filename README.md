# QuickExplain

A browser extension that explains selected text using AI (Mistral via OpenRouter).

## Features

- Select text on any webpage
- Get instant AI-powered explanations via tooltip
- Works on Chrome, Edge, and Firefox
- Lightweight backend with FastAPI and OpenRouter integration

## Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
```
OPENROUTER_API_KEY=your_api_key_here
```

Start the backend:
```bash
uvicorn app:app --reload --port 8000
```

### 2. Load Extension

1. Open Chrome/Edge: `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The extension is now active!

### 3. Usage

- Select a word or short phrase on any webpage
- A tooltip appears with the AI explanation
- Toggle "Enable on this browser" in the popup to enable/disable

## Architecture

- **Extension**: Content script captures selection, background script handles messaging
- **Backend**: FastAPI endpoint calls OpenRouter API (Mistral-7B model)
- **Storage**: Chrome storage for enable/disable toggle

## Demo

Works on any webpage (Wikipedia, news sites, etc.). Try selecting:
- "algorithm" → gets definition
- "climate change" → gets explanation
- Selections > 120 characters → rejected for cost/latency

## Dependencies

- Chrome/Firefox/Edge browser
- Python 3.8+
- FastAPI, uvicorn, requests, python-dotenv
- OpenRouter API key (free tier available)

## License

MIT
