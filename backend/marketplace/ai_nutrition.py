import base64
import json
import mimetypes
import os
import re
import socket
import ssl
import urllib.error
import urllib.parse
import urllib.request

import certifi


class NutritionEstimateError(Exception):
    pass


def _image_data(uploaded_file):
    mime_type = getattr(uploaded_file, "content_type", None)
    if not mime_type:
        mime_type = mimetypes.guess_type(getattr(uploaded_file, "name", ""))[0]
    if not mime_type:
        mime_type = "image/jpeg"
    encoded = base64.b64encode(uploaded_file.read()).decode("ascii")
    return mime_type, encoded


def _schema():
    nutrition = {
        "type": "OBJECT",
        "properties": {
            "calories": {"type": "INTEGER"},
            "proteinG": {"type": "NUMBER"},
            "carbsG": {"type": "NUMBER"},
            "fatG": {"type": "NUMBER"},
            "fiberG": {"type": "NUMBER"},
            "sodiumMg": {"type": "INTEGER"},
        },
        "required": ["calories", "proteinG", "carbsG", "fatG", "fiberG", "sodiumMg"],
    }
    return {
        "type": "OBJECT",
        "properties": {
            "items": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "name": {"type": "STRING"},
                        "nutrition": nutrition,
                        "confidence": {"type": "STRING", "enum": ["low", "medium", "high"]},
                    },
                    "required": ["name", "nutrition", "confidence"],
                },
            }
        },
        "required": ["items"],
    }


def _response_text(payload):
    if payload.get("output_text"):
        return payload["output_text"]
    for step in payload.get("steps", []):
        if step.get("type") == "model_output":
            for content in step.get("content", []):
                if content.get("type") == "text":
                    return content.get("text", "")
    for candidate in payload.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "text" in part:
                return part["text"]
    return ""


def _timeout_seconds():
    try:
        return int(os.getenv("GEMINI_REQUEST_TIMEOUT", "20"))
    except ValueError:
        return 20


def _post_json(url, body, api_key):
    separator = "&" if "?" in url else "?"
    url = f"{url}{separator}key={urllib.parse.quote(api_key)}"
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )
    context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(request, timeout=_timeout_seconds(), context=context) as response:
        return json.loads(response.read().decode("utf-8"))


def _generation_config(model):
    config = {
        "temperature": 0.1,
        "maxOutputTokens": 600,
        "responseMimeType": "application/json",
    }
    if model.startswith("gemini-2.5"):
        config["thinkingConfig"] = {"thinkingBudget": 0}
    return config


def _extract_json(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    if not cleaned.startswith("{"):
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


def _has_useful_nutrition(estimate, expected_count):
    items = estimate.get("items")
    if not isinstance(items, list) or len(items) < expected_count:
        return False
    for item in items[:expected_count]:
        nutrition = item.get("nutrition") if isinstance(item, dict) else None
        if not isinstance(nutrition, dict):
            return False
        values = [
            nutrition.get("calories"),
            nutrition.get("proteinG"),
            nutrition.get("carbsG"),
            nutrition.get("fatG"),
            nutrition.get("fiberG"),
        ]
        if sum(float(value or 0) for value in values) <= 0:
            return False
    return True


def _generate_content_estimate(api_key, model, prompt, mime_type, image_data):
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_data,
                        }
                    },
                ]
            }
        ],
        "generationConfig": _generation_config(model),
    }
    payload = _post_json(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        body,
        api_key,
    )
    return _extract_json(_response_text(payload))


def _text_only_estimate(api_key, model, item_names):
    prompt = (
        "Estimate typical nutrition per serve for each food item name. "
        "Return one item for each supplied name, in the same order. "
        "Food item names: "
        f"{json.dumps(item_names)}"
    )
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                ]
            }
        ],
        "generationConfig": _generation_config(model),
    }
    payload = _post_json(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        body,
        api_key,
    )
    return _extract_json(_response_text(payload))


def _model_candidates():
    preferred = os.getenv("GEMINI_NUTRITION_MODEL", "").strip()
    candidates = [
        "gemini-2.5-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
    ]
    if preferred:
        candidates.append(preferred)
    unique = []
    for model in candidates:
        if model and model not in unique:
            unique.append(model)
    return unique


def estimate_nutrition_from_image(uploaded_file, item_names):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise NutritionEstimateError("GEMINI_API_KEY is not configured.")

    names = [name for name in item_names if name]
    mime_type, image_data = _image_data(uploaded_file)
    prompt = (
        "Estimate nutrition per serve for each surplus food item visible in the image. "
        "Use the image as the primary source, using the supplied item names only to label the results. "
        "Return one item for each supplied name, in the same order. "
        "Return JSON with this exact shape: "
        "{\"items\":[{\"name\":\"food name\",\"nutrition\":{\"calories\":0,\"proteinG\":0,\"carbsG\":0,\"fatG\":0,\"fiberG\":0,\"sodiumMg\":0},\"confidence\":\"low|medium|high\"}]}. "
        f"Food item names: {json.dumps(names)}"
    )
    errors = []
    for model in _model_candidates():
        try:
            estimate = _generate_content_estimate(api_key, model, prompt, mime_type, image_data)
            if not _has_useful_nutrition(estimate, len(names)):
                raise ValueError("Gemini image response did not contain usable nutrition.")
            estimate["source"] = "gemini"
            estimate["model"] = model
            return estimate
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace").strip()
            message = detail or f"HTTP {error.code} {error.reason}"
            errors.append(f"{model}: {message}")
            if error.code not in (400, 404, 429):
                break
        except (urllib.error.URLError, TimeoutError, socket.timeout, json.JSONDecodeError, ValueError) as image_error:
            try:
                estimate = _text_only_estimate(api_key, model, names)
                if not _has_useful_nutrition(estimate, len(names)):
                    raise ValueError("Gemini item-name response did not contain usable nutrition.")
                estimate["source"] = "gemini_text"
                estimate["model"] = model
                estimate["warning"] = f"Image nutrition estimate failed, so Gemini estimated from item names instead: {image_error}"
                return estimate
            except urllib.error.HTTPError as text_error:
                detail = text_error.read().decode("utf-8", errors="replace").strip()
                message = detail or f"HTTP {text_error.code} {text_error.reason}"
                errors.append(f"{model}: {message}")
                if text_error.code not in (400, 404, 429):
                    break
            except urllib.error.URLError as text_error:
                errors.append(f"{model}: {text_error.reason or text_error}")
            except (TimeoutError, socket.timeout):
                errors.append(f"{model}: timed out")
            except json.JSONDecodeError:
                errors.append(f"{model}: response was not valid JSON")
            except ValueError as text_error:
                errors.append(f"{model}: {text_error}")

    detail = " | ".join(errors[-3:]) if errors else "No Gemini model returned nutrition."
    raise NutritionEstimateError(f"Gemini nutrition request failed: {detail}")
