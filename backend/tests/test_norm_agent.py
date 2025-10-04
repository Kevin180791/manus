import pytest

from backend.agent_core.norm_agent import (
    LLMRateLimitError,
    LLMTimeoutError,
    NormCheckResult,
    build_norm_check_prompt,
    parse_norm_check_response,
    run_norm_check,
)


def test_build_norm_check_prompt_structure():
    prompt = build_norm_check_prompt("Bürogebäude", "Heizung", "Luftwechsel 6/h in Tiefgarage")

    assert "Projekttyp: Bürogebäude" in prompt
    assert "Gewerk: Heizung" in prompt
    assert "Liefere ausschließlich eine JSON-Antwort" in prompt
    assert "Plantext" in prompt


def test_parse_norm_check_response_valid_json():
    response = """{
        "norm_reference": "VDI 2053",
        "assessment": "Konform",
        "recommendation": "Keine weiteren Maßnahmen erforderlich"
    }"""

    result = parse_norm_check_response(response)

    assert isinstance(result, NormCheckResult)
    assert result.norm_reference == "VDI 2053"
    assert result.assessment == "Konform"
    assert result.recommendation == "Keine weiteren Maßnahmen erforderlich"


def test_parse_norm_check_response_embedded_json():
    response = "Antwort:\n```json\n{\n  \"norm\": \"EN 12101\",\n  \"evaluation\": \"teilweise konform\",\n  \"next_steps\": \"Entrauchungskonzept nachschärfen\"\n}\n```"

    result = parse_norm_check_response(response)

    assert result.norm_reference == "EN 12101"
    assert result.assessment == "teilweise konform"
    assert result.recommendation == "Entrauchungskonzept nachschärfen"


def test_run_norm_check_maps_timeout_to_custom_error():
    class TimeoutClient:
        def generate(self, prompt: str) -> str:  # pragma: no cover - executed in test
            raise TimeoutError("request timed out")

    with pytest.raises(LLMTimeoutError):
        run_norm_check("Büro", "Lüftung", "Test", llm_client=TimeoutClient())


def test_run_norm_check_maps_rate_limit_to_custom_error():
    RateLimitError = type("RateLimitError", (Exception,), {})

    class RateLimitClient:
        def generate(self, prompt: str) -> str:  # pragma: no cover - executed in test
            raise RateLimitError("rate limit")

    with pytest.raises(LLMRateLimitError):
        run_norm_check("Büro", "Lüftung", "Test", llm_client=RateLimitClient())
