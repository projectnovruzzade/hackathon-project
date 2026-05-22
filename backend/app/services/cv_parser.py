from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any

try:
    import pdfplumber
except ModuleNotFoundError:  # pragma: no cover - optional runtime dependency
    pdfplumber = None  # type: ignore[assignment]


SYSTEM_PROMPT = """You are a CV parsing assistant.
Extract structured JSON from the provided CV text.
Return JSON only.
"""


USER_PROMPT_TEMPLATE = """Extract structured JSON data from this CV text.
Use null for unknown scalar fields and [] for unknown list fields.
Dates should be YYYY-MM when possible.

CV TEXT:
{cv_text}
"""


SKILL_CATEGORY_MAP: dict[str, str] = {
    "python": "backend",
    "flask": "backend",
    "django": "backend",
    "fastapi": "backend",
    "node.js": "backend",
    "node": "backend",
    "express": "backend",
    "java": "backend",
    "spring": "backend",
    "react": "frontend",
    "next.js": "frontend",
    "next": "frontend",
    "typescript": "frontend",
    "javascript": "frontend",
    "html": "frontend",
    "css": "frontend",
    "tailwind": "frontend",
    "docker": "devops",
    "kubernetes": "devops",
    "aws": "devops",
    "azure": "devops",
    "gcp": "devops",
    "terraform": "devops",
    "tensorflow": "ml",
    "pytorch": "ml",
    "scikit-learn": "ml",
    "machine learning": "ml",
    "nlp": "ml",
    "cybersecurity": "security",
    "security": "security",
    "penetration testing": "security",
    "figma": "design",
    "ui/ux": "design",
    "adobe xd": "design",
    "swift": "mobile",
    "kotlin": "mobile",
    "flutter": "mobile",
    "react native": "mobile",
}


def extract_text_from_pdf(pdf_path: str) -> str:
    if pdfplumber is None:
        raise RuntimeError("pdfplumber is not installed. Install it with: pip install pdfplumber")

    full_text: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text(
                x_tolerance=3,
                y_tolerance=3,
                layout=True,
                x_density=7.25,
                y_density=13,
            )
            if text:
                full_text.append(f"--- PAGE {index} ---\n{text}")
    return "\n\n".join(full_text)


def _extract_json_payload(raw_text: str) -> str:
    payload = raw_text.strip()
    if payload.startswith("```"):
        lines = payload.splitlines()
        payload = "\n".join(line for line in lines if not line.strip().startswith("```")).strip()
    return payload


def parse_cv_with_gemini(cv_text: str, api_key: str, model: str = "gemini-2.5-flash") -> dict[str, Any]:
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(cv_text=cv_text)}"
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                ]
            }
        ]
    }
    encoded_body = json.dumps(body).encode("utf-8")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={urllib.parse.quote(api_key)}"
    )
    request = urllib.request.Request(url, data=encoded_body, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network dependent
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini API error: {exc.code} {detail}") from exc
    except urllib.error.URLError as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"Gemini API connection error: {exc.reason}") from exc

    text_parts = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    )
    if not text_parts:
        raise RuntimeError("Gemini returned empty response")

    raw_response = "".join(part.get("text", "") for part in text_parts if isinstance(part, dict)).strip()
    normalized = _extract_json_payload(raw_response)
    return json.loads(normalized)


def _infer_level_from_text(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["senior", "lead", "principal", "expert"]):
        return "expert"
    if any(word in lowered for word in ["advanced", "proficient"]):
        return "advanced"
    if any(word in lowered for word in ["junior", "entry", "beginner", "intern"]):
        return "beginner"
    return "intermediate"


def _map_skill_category(skill_name: str) -> str:
    lowered = skill_name.strip().lower()
    return SKILL_CATEGORY_MAP.get(lowered, "other")


def _dedupe_skills(skills: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, str]] = set()
    result: list[dict[str, str]] = []
    for item in skills:
        key = (item["name"].strip().lower(), item["category"])
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def _extract_skills_fallback(cv_text: str) -> list[dict[str, str]]:
    lowered = cv_text.lower()
    found: list[dict[str, str]] = []
    for key, category in SKILL_CATEGORY_MAP.items():
        if re.search(rf"\b{re.escape(key)}\b", lowered):
            found.append({"name": key.title(), "level": "intermediate", "category": category})
    return _dedupe_skills(found)


def parse_cv_document(pdf_path: str, gemini_api_key: str | None = None, model: str = "gemini-2.5-flash") -> dict[str, Any]:
    text = extract_text_from_pdf(pdf_path)
    if not text.strip():
        raise ValueError("Could not extract text from PDF. If the file is scanned, OCR is required.")

    parsed: dict[str, Any]
    if gemini_api_key:
        parsed = parse_cv_with_gemini(text, api_key=gemini_api_key, model=model)
    else:
        parsed = {"skills": {"technical": []}, "metadata": {"detected_language": "unknown"}}

    technical_skills = parsed.get("skills", {}).get("technical", []) if isinstance(parsed.get("skills"), dict) else []
    normalized_skills: list[dict[str, str]] = []
    for skill_name in technical_skills:
        if not isinstance(skill_name, str) or not skill_name.strip():
            continue
        normalized_skills.append(
            {
                "name": skill_name.strip(),
                "level": _infer_level_from_text(text),
                "category": _map_skill_category(skill_name),
            }
        )

    if not normalized_skills:
        normalized_skills = _extract_skills_fallback(text)

    normalized_skills = _dedupe_skills(normalized_skills)

    return {
        "parsed": parsed,
        "extracted_skills": normalized_skills,
        "text_length": len(text),
        "processed_at": datetime.utcnow().isoformat(),
    }
