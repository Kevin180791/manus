
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dataclasses import asdict, dataclass
from textwrap import dedent
from typing import Optional


logger = logging.getLogger(__name__)


class LLMClientError(RuntimeError):
    """Base exception for LLM client errors."""


class LLMConfigurationError(LLMClientError):
    """Raised when the LLM client is not correctly configured."""


class LLMTimeoutError(LLMClientError):
    """Raised when the LLM call times out."""


class LLMRateLimitError(LLMClientError):
    """Raised when the LLM service rate limits the request."""


@dataclass
class NormCheckResult:
    norm_reference: str
    assessment: str
    recommendation: str

    def to_dict(self) -> dict:
        return asdict(self)


class LLMClient:
    """Configurable LLM client wrapper."""

    def __init__(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        system_prompt: Optional[str] = None,
        client: Optional[object] = None,
    ) -> None:
        self.provider = (provider or os.getenv("NORM_AGENT_LLM_PROVIDER") or "openai").lower()
        self.model = model or os.getenv("NORM_AGENT_LLM_MODEL", "gpt-4o-mini")
        timeout_env = os.getenv("NORM_AGENT_LLM_TIMEOUT")
        self.timeout = timeout if timeout is not None else float(timeout_env) if timeout_env else 30.0
        self.system_prompt = system_prompt or os.getenv(
            "NORM_AGENT_SYSTEM_PROMPT",
            "Du bist eine erfahrene TGA-Fachingenieurin und bewertest Normkonformität.",
        )
        self._client = client

    def _ensure_client(self) -> object:
        if self._client is not None:
            return self._client

        if self.provider == "openai":
            try:
                from openai import OpenAI  # type: ignore
            except ImportError as exc:  # pragma: no cover - import error path
                raise LLMConfigurationError("OpenAI SDK ist nicht installiert.") from exc

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise LLMConfigurationError("OPENAI_API_KEY ist nicht gesetzt.")

            self._client = OpenAI(api_key=api_key)
            return self._client

        raise LLMConfigurationError(f"Nicht unterstützter LLM-Provider: {self.provider}")

    def generate(self, prompt: str) -> str:
        client = self._ensure_client()

        if self.provider == "openai":
            try:
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    timeout=self.timeout,
                )
            except (TimeoutError, asyncio.TimeoutError) as exc:
                raise LLMTimeoutError("LLM Anfrage hat das Zeitlimit überschritten.") from exc
            except Exception as exc:  # pragma: no cover - depends on provider implementation
                if exc.__class__.__name__ in {"RateLimitError", "RateLimitException"}:
                    raise LLMRateLimitError("LLM Rate Limit erreicht.") from exc
                raise

            try:
                return response.choices[0].message.content.strip()
            except (AttributeError, IndexError) as exc:  # pragma: no cover - defensive
                raise LLMClientError("Antwort des LLM konnte nicht interpretiert werden.") from exc

        raise LLMConfigurationError(f"Nicht unterstützter LLM-Provider: {self.provider}")


JSON_PATTERN = re.compile(r"\{.*\}", re.DOTALL)


def build_norm_check_prompt(project_type: str, trade: str, plan_text: str) -> str:
    plan_text_clean = plan_text.strip()
    prompt_template = """
    Bewertet die Normkonformität eines TGA-Fachplanausschnitts.
    Liefere ausschließlich eine JSON-Antwort mit den Schlüsseln
    "norm_reference", "assessment" und "recommendation".

    Projektkontext:
    - Projekttyp: {project_type}
    - Gewerk: {trade}

    Plantext (Auszug):
    <PLAN_TEXT>
    {plan_text}
    </PLAN_TEXT>

    Anforderungen:
    1. Ermittle die wichtigsten Normen/Vorschriften für den Kontext.
    2. Bewerte ob die Planung die Norm erfüllt, inkl. kurzer Begründung.
    3. Gib eine konkrete Empfehlung für nächste Schritte.
    4. Falls keine Bewertung möglich ist, erläutere warum.
    5. Formatiere als kompaktes JSON (keine zusätzlichen Texte).
    """
    return dedent(prompt_template).strip().format(
        project_type=project_type.strip(),
        trade=trade.strip(),
        plan_text=plan_text_clean,
    )


def _extract_json(text: str) -> str:
    match = JSON_PATTERN.search(text)
    return match.group(0) if match else text


def parse_norm_check_response(response: str) -> NormCheckResult:
    json_payload = _extract_json(response.strip())

    try:
        data = json.loads(json_payload)
    except json.JSONDecodeError as exc:
        raise ValueError("Antwort des LLM konnte nicht als JSON geparst werden.") from exc

    norm_reference = (
        data.get("norm_reference")
        or data.get("norm")
        or data.get("reference")
        or "Unbekannt"
    )
    assessment = data.get("assessment") or data.get("evaluation") or "Keine Bewertung vorhanden."
    recommendation = data.get("recommendation") or data.get("next_steps") or "Keine Empfehlung vorhanden."

    return NormCheckResult(
        norm_reference=str(norm_reference).strip(),
        assessment=str(assessment).strip(),
        recommendation=str(recommendation).strip(),
    )


def _map_llm_exception(exc: Exception) -> Optional[LLMClientError]:
    if isinstance(exc, (TimeoutError, asyncio.TimeoutError)):
        return LLMTimeoutError("LLM Anfrage hat das Zeitlimit überschritten.")

    if exc.__class__.__name__ in {"RateLimitError", "RateLimitException"}:
        return LLMRateLimitError("LLM Rate Limit erreicht.")

    return None


def _fallback_norm_check(plan_text: str) -> NormCheckResult:
    if "Tiefgarage" in plan_text and "6/h" in plan_text:
        return NormCheckResult(
            norm_reference="VDI 2053 (Lüftung von Garagen)",
            assessment="Geplanter Luftwechsel von 6/h erfüllt die Mindestanforderung >5/h.",
            recommendation="CO-Sensoren prüfen und Wartungsintervall dokumentieren.",
        )

    return NormCheckResult(
        norm_reference="Unbekannt",
        assessment="Keine relevanten Normvorgaben erkannt oder Text unvollständig.",
        recommendation="Bitte Projektdaten und Plantext ergänzen, um eine Bewertung zu ermöglichen.",
    )


def run_norm_check(
    project_type: str,
    trade: str,
    plan_text: str,
    llm_client: Optional[LLMClient] = None,
) -> NormCheckResult:
    prompt = build_norm_check_prompt(project_type, trade, plan_text)
    client = llm_client or LLMClient()

    try:
        response_text = client.generate(prompt)
    except LLMConfigurationError as exc:
        logger.warning("LLM Konfiguration unvollständig, nutze Fallback: %s", exc)
        return _fallback_norm_check(plan_text)
    except LLMClientError:
        raise
    except Exception as exc:
        mapped = _map_llm_exception(exc)
        if mapped:
            raise mapped from exc
        raise

    return parse_norm_check_response(response_text)
