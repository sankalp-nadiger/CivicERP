# AI Orchestrator (Model-Only Pipeline)

This service provides one backend contract for:
- STT (Whisper/OpenAI transcription API)
- LLM conversation (JSON-only complaint interview)
- TTS (OpenAI speech API)
- Lip-sync metadata (viseme timeline estimate)
- Optional image classification + ML summary/urgency via existing microservices

It is designed to support the flow:

User speech -> STT -> LLM -> TTS -> LipSync metadata -> Avatar animation -> Complaint registration

## Endpoints

- `GET /health`
- `POST /v1/sessions/start`
- `POST /v1/stt/transcribe` (multipart: `audio`)
- `POST /v1/tts/speak` (json: `text`, `locale`)
- `POST /v1/lipsync/estimate` (json: `text`)
- `POST /v1/chat/completions` (OpenAI-compatible chat endpoint)
- `POST /v1/pipeline/turn` (combined turn endpoint)

## Run

1. Create env file:

```powershell
cd e:\civic\server\ai_orchestrator
copy .env.example .env
```

2. Install dependencies:

```powershell
E:/civic/.venv/Scripts/python.exe -m pip install -r requirements.txt
```

3. Start service:

```powershell
E:/civic/.venv/Scripts/python.exe app.py
```

Default URL: `http://127.0.0.1:5100`

## Flutter Integration

Set Flutter chat URL to orchestrator OpenAI-compatible endpoint:

```powershell
flutter run --dart-define=AI_CHAT_URL=http://127.0.0.1:5100/v1/chat/completions
```

When running on a physical device, use your machine LAN IP instead of `127.0.0.1`.

## Combined Turn Contract (`/v1/pipeline/turn`)

Supports JSON body (text-only) or multipart form (audio/image + text):

- `session_id` (required)
- `user_text` (optional if `audio` present)
- `audio` file (optional)
- `image` file (optional)
- `locale` (optional)
- `auto_language` (optional, default `true`)

Response includes:
- detected language
- assistant JSON (question/finalize/result)
- TTS audio (base64, if configured)
- avatar animation metadata (visemes/blink/head motion)
- optional image + ML enrichment

## Notes

- This service stores session conversation in-memory (`SESSION_STORE`). For production, use Redis/DB.
- If provider keys are missing, STT/TTS/LLM endpoints return descriptive errors.
- Image and ML enrichment gracefully degrade when corresponding microservices are unavailable.
