# AI Skin Screening Tool

A simple full-stack web app for local skin-condition screening with ONNX inference.

## Project Structure

- `frontend/` - React + Vite + Tailwind UI
- `backend/` - Express API + ONNX runtime inference
- `model_ham10000.onnx` - local model file (place in project root)

## Backend Setup

1. Open terminal in `backend`:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Create env file:
   - Copy `.env.example` to `.env`
4. Start backend:
   - `npm run dev`

Backend runs at `http://localhost:5000`.

## Frontend Setup

1. Open terminal in `frontend`:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Create env file:
   - Copy `.env.example` to `.env`
4. Start frontend:
   - `npm run dev`

Frontend runs at `http://localhost:5173`.

## API

### `POST /predict`

Form-data:
- `image`: image file

Response:

```json
{
  "confidence": 0.82,
  "risk": "high"
}
```

Risk rules:
- `> 0.7` -> `high`
- `0.4 - 0.7` -> `moderate`
- `< 0.4` -> `low`

## Notes

- The backend loads the ONNX model once at startup.
- Inference is local only (no external APIs).
- If the model file is missing, backend startup fails with a clear error.
