# HANDSFREE AI — Browse Freely. Control Naturally.

Voice + webcam browsing for a college hackathon. Camera frames are processed **in the browser** (MediaPipe) and never sent to the backend.

## Folders
```
handsfree-ai/
  frontend/   React + Vite + Tailwind   (Developer 1)
  backend/    FastAPI                    (Developer 2)
  docs/
```

## Run the backend (Developer 2)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
Verify: open http://127.0.0.1:8000/api/health → `{"status":"ok","storage":"in-memory"}`
and http://127.0.0.1:8000/docs to try every endpoint.

## Run the frontend (Developer 1)
```bash
cd frontend
npm install
cp .env.example .env             # Windows: copy .env.example .env
npm run dev
```
Open http://localhost:5173 in **Chrome or Edge** (needed for voice recognition).
No backend yet? Set `VITE_USE_MOCK=true` in `frontend/.env`.

## Verify each feature
| Feature | How to check |
|---|---|
| Backend link | Dashboard → Backend card says "Connected" |
| Webcam | Start Handsfree → allow camera → preview shows; stop → camera light turns off |
| Head tracking | Look at screen centre, press "Set centre", open Workspace, turn head → cyan pointer moves |
| Face lost | Cover the camera → amber warning, pointer stops |
| Voice | Say "scroll down", "go to the top", "search for python" → see them in Recent commands |
| Typing | Click the message box on the Contact form, say "type hello" |
| Confirmation | Point at "Send message", say "click", then "confirm" or "cancel" |
| Session saved | Stop Handsfree, then open http://127.0.0.1:8000/api/sessions |

## Git workflow
```bash
git clone https://github.com/shalomdabre5-dabre/handsfree-ai.git
cd handsfree-ai
git checkout -b feature/short-name
git add .
git commit -m "Describe what you did"
git push -u origin feature/short-name   # then open the Pull Request link GitHub prints
```
Never commit `.env` files.
