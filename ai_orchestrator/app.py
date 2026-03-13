from __future__ import annotations

import base64
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

app = Flask(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
OPENAI_STT_MODEL = os.getenv("OPENAI_STT_MODEL", "whisper-1")
OPENAI_TTS_MODEL = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
OPENAI_TTS_VOICE = os.getenv("OPENAI_TTS_VOICE", "alloy")

ML_MICRO_URL = os.getenv("ML_MICRO_URL", "http://127.0.0.1:5002").rstrip("/")
IMAGE_MICRO_URL = os.getenv("IMAGE_MICRO_URL", "http://127.0.0.1:5001").rstrip("/")

SESSION_STORE: dict[str, dict[str, Any]] = {}

SUPPORTED_LOCALES = {
    "en": "en-US",
    "en-US": "en-US",
    "hi": "hi-IN",
    "hi-IN": "hi-IN",
    "kn": "kn-IN",
    "kn-IN": "kn-IN",
    "ta": "ta-IN",
    "ta-IN": "ta-IN",
    "te": "te-IN",
    "te-IN": "te-IN",
}


def _error(message: str, status_code: int = 400):
    return jsonify({"ok": False, "error": message}), status_code


def _status_from_exception_message(message: str) -> int:
    lowered = message.lower()
    if "insufficient_quota" in lowered or "429" in lowered:
        return 429
    if "401" in lowered or "invalid_api_key" in lowered:
        return 401
    return 500


def _normalize_locale(locale: str | None) -> str:
    if not locale:
        return "en-US"
    clean = locale.strip()
    return SUPPORTED_LOCALES.get(clean, SUPPORTED_LOCALES.get(clean.lower(), "en-US"))


def _detect_language_from_text(text: str) -> str:
    if any("\u0C80" <= ch <= "\u0CFF" for ch in text):
        return "kn-IN"
    if any("\u0B80" <= ch <= "\u0BFF" for ch in text):
        return "ta-IN"
    if any("\u0C00" <= ch <= "\u0C7F" for ch in text):
        return "te-IN"
    if any("\u0900" <= ch <= "\u097F" for ch in text):
        return "hi-IN"
    return "en-US"


def _openai_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }


def _estimate_visemes(text: str) -> list[dict[str, Any]]:
    viseme_map = {
        "a": "AA",
        "e": "EH",
        "i": "IH",
        "o": "OH",
        "u": "UW",
        "m": "MBP",
        "b": "MBP",
        "p": "MBP",
        "f": "FV",
        "v": "FV",
    }

    timeline: list[dict[str, Any]] = []
    t = 0.0
    step = 0.085

    for ch in text.lower():
        if not ch.isalpha():
            t += step * 0.6
            continue
        timeline.append(
            {
                "t": round(t, 3),
                "viseme": viseme_map.get(ch, "REST"),
                "weight": 0.85,
            }
        )
        t += step

    return timeline


def _openai_chat(messages: list[dict[str, str]], model: str | None = None) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured on server")

    payload = {
        "model": model or OPENAI_CHAT_MODEL,
        "messages": messages,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    resp = requests.post(
        f"{OPENAI_BASE_URL}/chat/completions",
        headers=_openai_headers(),
        json=payload,
        timeout=45,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Chat provider error {resp.status_code}: {resp.text}")

    data = resp.json()
    return (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )


def _openai_stt(audio_bytes: bytes, filename: str = "speech.wav") -> dict[str, Any]:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured on server")

    files = {"file": (filename, audio_bytes, "application/octet-stream")}
    form = {"model": OPENAI_STT_MODEL}

    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    resp = requests.post(
        f"{OPENAI_BASE_URL}/audio/transcriptions",
        headers=headers,
        data=form,
        files=files,
        timeout=90,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"STT provider error {resp.status_code}: {resp.text}")

    data = resp.json()
    text = data.get("text", "").strip()
    language = data.get("language", "")
    locale = _normalize_locale(language)

    return {"text": text, "language": language, "locale": locale}


def _openai_tts(text: str, locale: str) -> dict[str, Any]:
    if not OPENAI_API_KEY:
        return {"audio_base64": None, "format": "mp3"}

    payload = {
        "model": OPENAI_TTS_MODEL,
        "voice": OPENAI_TTS_VOICE,
        "input": text,
        "format": "mp3",
    }

    resp = requests.post(
        f"{OPENAI_BASE_URL}/audio/speech",
        headers=_openai_headers(),
        json=payload,
        timeout=60,
    )

    if resp.status_code not in (200, 201):
        return {"audio_base64": None, "format": "mp3", "error": resp.text}

    encoded = base64.b64encode(resp.content).decode("utf-8")
    return {"audio_base64": encoded, "format": "mp3", "locale": locale}


def _classify_image(image_bytes: bytes, filename: str) -> dict[str, Any] | None:
    try:
        files = {"image": (filename, image_bytes, "application/octet-stream")}
        resp = requests.post(
            f"{IMAGE_MICRO_URL}/classifyImage",
            files=files,
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json()
        return None
    except Exception:
        return None


def _score_summary(complaint_text: str) -> dict[str, Any]:
    out = {"summary": complaint_text, "score": 3}

    try:
        s_resp = requests.post(
            f"{ML_MICRO_URL}/getSummary",
            json={"message": complaint_text},
            timeout=20,
        )
        if s_resp.status_code == 200:
            out["summary"] = s_resp.json().get("summary", complaint_text)
    except Exception:
        pass

    try:
        c_resp = requests.post(
            f"{ML_MICRO_URL}/getScore",
            json={"complaint": complaint_text},
            timeout=20,
        )
        if c_resp.status_code == 200:
            out["score"] = c_resp.json().get("index", 3)
    except Exception:
        pass

    return out


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "service": "ai-orchestrator",
            "timestamp": int(time.time()),
            "openaiConfigured": bool(OPENAI_API_KEY),
            "models": {
                "chat": OPENAI_CHAT_MODEL,
                "stt": OPENAI_STT_MODEL,
                "tts": OPENAI_TTS_MODEL,
            },
        }
    )


@app.post("/v1/sessions/start")
def start_session():
    payload = request.get_json(silent=True) or {}
    locale = _normalize_locale(payload.get("locale"))
    session_id = str(uuid.uuid4())

    system_prompt = (
        "You are a municipality complaint assistant. Ask one short question at a time and "
        "collect department/type, location, description, and optional photo evidence. "
        "Return JSON only. "
        "Schema for question turn: {\"question\":string,\"options\":[string],\"finalize\":false}. "
        "Schema for final turn: {\"finalize\":true,\"result\":{\"department\":string,\"type\":string,\"location\":string,\"description\":string,\"priority\":\"low|medium|high\",\"photo_requested\":boolean}}. "
        f"Respond in locale {locale}."
    )

    SESSION_STORE[session_id] = {
        "locale": locale,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": "Start the interview now and ask the first complaint question.",
            },
        ],
    }

    return jsonify({"ok": True, "session_id": session_id, "locale": locale})


@app.post("/v1/stt/transcribe")
def transcribe_audio():
    if "audio" not in request.files:
        return _error("Missing audio file (multipart field name: audio)", 400)

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    if not audio_bytes:
        return _error("Audio file is empty", 400)

    try:
        stt_result = _openai_stt(audio_bytes, audio_file.filename or "speech.wav")
        return jsonify({"ok": True, **stt_result})
    except Exception as exc:
        return _error(str(exc), 500)


@app.post("/v1/tts/speak")
def speak_tts():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return _error("Missing text", 400)

    locale = _normalize_locale(payload.get("locale"))
    tts = _openai_tts(text, locale)

    return jsonify(
        {
            "ok": True,
            "text": text,
            "locale": locale,
            "audio": tts,
            "avatar": {
                "visemes": _estimate_visemes(text),
                "blink": {"interval_ms": 2600, "close_ms": 120},
                "head_motion": {"enabled": True, "amplitude": 0.03},
            },
        }
    )


@app.post("/v1/lipsync/estimate")
def estimate_lipsync():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return _error("Missing text", 400)

    return jsonify(
        {
            "ok": True,
            "visemes": _estimate_visemes(text),
            "blink": {"interval_ms": 2600, "close_ms": 120},
            "head_motion": {"enabled": True, "amplitude": 0.03},
        }
    )


@app.post("/v1/chat/completions")
def openai_compatible_chat():
    payload = request.get_json(silent=True) or {}
    messages = payload.get("messages")

    if not isinstance(messages, list) or not messages:
        return _error("messages must be a non-empty array", 400)

    model = payload.get("model") or OPENAI_CHAT_MODEL

    try:
        content = _openai_chat(messages, model=model)
        return jsonify(
            {
                "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": content},
                        "finish_reason": "stop",
                    }
                ],
            }
        )
    except Exception as exc:
        return _error(str(exc), _status_from_exception_message(str(exc)))


@app.post("/v1/pipeline/turn")
def pipeline_turn():
    payload = request.get_json(silent=True) if request.is_json else {}
    payload = payload or {}

    session_id = request.form.get("session_id") or payload.get("session_id")
    if not session_id:
        return _error("Missing session_id", 400)

    if session_id not in SESSION_STORE:
        return _error("Invalid session_id. Start session first.", 404)

    session = SESSION_STORE[session_id]
    locale = _normalize_locale(request.form.get("locale") or payload.get("locale") or session.get("locale"))

    user_text = ""
    detected_locale = locale

    if "audio" in request.files:
        audio_file = request.files["audio"]
        audio_bytes = audio_file.read()
        try:
            stt_result = _openai_stt(audio_bytes, audio_file.filename or "speech.wav")
            user_text = stt_result.get("text", "")
            detected_locale = _normalize_locale(stt_result.get("locale") or locale)
        except Exception as exc:
            return _error(f"STT failed: {exc}", 500)
    else:
        user_text = (
            request.form.get("user_text")
            if not request.is_json
            else payload.get("user_text", "")
        ).strip()

    if not user_text:
        return _error("Provide either audio file or non-empty user_text", 400)

    if request.form.get("auto_language", "true").lower() == "true":
        detected_locale = _detect_language_from_text(user_text)

    session["locale"] = detected_locale
    session["messages"].append({"role": "user", "content": user_text})

    image_summary = None
    image_department = None
    if "image" in request.files:
        image_file = request.files["image"]
        image_bytes = image_file.read()
        classification = _classify_image(image_bytes, image_file.filename or "evidence.jpg")
        if classification:
            image_department = classification.get("primary_department")
            image_summary = (
                f"User attached complaint photo. Suggested department: {image_department}. "
                f"Confidence: {classification.get('confidence')}"
            )
            session["messages"].append(
                {
                    "role": "user",
                    "content": image_summary,
                }
            )

    try:
        assistant_content = _openai_chat(session["messages"])
    except Exception as exc:
        message = f"LLM failed: {exc}"
        return _error(message, _status_from_exception_message(message))

    session["messages"].append({"role": "assistant", "content": assistant_content})

    try:
        assistant_json = json.loads(assistant_content)
    except Exception:
        try:
            start = assistant_content.find("{")
            end = assistant_content.rfind("}")
            assistant_json = json.loads(assistant_content[start : end + 1])
        except Exception:
            assistant_json = {
                "question": "Please describe your issue clearly.",
                "options": ["Road", "Water", "Sanitation", "Other"],
                "finalize": False,
            }

    finalize = bool(assistant_json.get("finalize", False))
    result = assistant_json.get("result") if finalize else None

    score_data = None
    if finalize and isinstance(result, dict):
        complaint_text = (result.get("description") or "").strip()
        if complaint_text:
            score_data = _score_summary(complaint_text)
            result["summary"] = score_data.get("summary")
            result["urgency_score"] = score_data.get("score")
        if image_department and not result.get("department"):
            result["department"] = image_department

    assistant_text = (
        assistant_json.get("question")
        if not finalize
        else "Thank you. Your complaint details are collected."
    )

    tts_data = _openai_tts(assistant_text, detected_locale)

    return jsonify(
        {
            "ok": True,
            "session_id": session_id,
            "language": detected_locale,
            "user_text": user_text,
            "assistant": assistant_json,
            "audio": tts_data,
            "avatar": {
                "visemes": _estimate_visemes(assistant_text),
                "blink": {"interval_ms": 2600, "close_ms": 120},
                "head_motion": {"enabled": True, "amplitude": 0.03},
            },
            "result": result,
            "ml": score_data,
            "image": {
                "department": image_department,
                "summary": image_summary,
            },
        }
    )


if __name__ == "__main__":
    host = os.getenv("AI_ORCHESTRATOR_HOST", "0.0.0.0")
    port = int(os.getenv("AI_ORCHESTRATOR_PORT", "5100"))
    debug = os.getenv("AI_ORCHESTRATOR_DEBUG", "true").lower() == "true"
    app.run(host=host, port=port, debug=debug)
