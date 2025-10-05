"""Embedding utilities and helpers for RAG pipelines."""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from typing import Iterable, List, Optional

from backend.core.config import Settings, get_settings


logger = logging.getLogger(__name__)


class EmbeddingServiceError(RuntimeError):
    """Raised when embedding generation fails."""


@dataclass
class EmbeddingResponse:
    vector: List[float]
    model: str
    dimensions: int


class EmbeddingService:
    """Handles embedding creation with local-first fallback logic."""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        *,
        requests_module: Optional[object] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._requests = requests_module

    @classmethod
    def from_env(cls) -> Optional["EmbeddingService"]:
        """Factory that returns an instance if a backend is configured."""

        settings = get_settings()
        if not any(
            [
                settings.test_mode,
                bool(settings.ollama_base_url),
                bool(settings.openai_api_key),
            ]
        ):
            return None
        return cls(settings=settings)

    def generate(self, text: str) -> EmbeddingResponse:
        """Generate an embedding for the supplied text."""

        if not text:
            raise EmbeddingServiceError("Text für Embedding darf nicht leer sein.")

        if self.settings.test_mode:
            vector = self._fake_embedding(text)
            return EmbeddingResponse(vector=vector, model="test/fake", dimensions=len(vector))

        errors: List[str] = []

        if self.settings.ollama_base_url:
            try:
                return self._generate_via_ollama(text)
            except EmbeddingServiceError as exc:
                errors.append(f"Ollama: {exc}")

        if self.settings.openai_api_key:
            try:
                return self._generate_via_openai(text)
            except EmbeddingServiceError as exc:
                errors.append(f"OpenAI: {exc}")

        if errors:
            raise EmbeddingServiceError("; ".join(errors))

        raise EmbeddingServiceError("Kein Embedding-Backend konfiguriert.")

    # ------------------------------------------------------------------
    # Backend implementations
    # ------------------------------------------------------------------
    def _generate_via_ollama(self, text: str) -> EmbeddingResponse:
        endpoint = f"{self.settings.ollama_base_url.rstrip('/')}/api/embeddings"
        payload = {"model": self.settings.ollama_embed_model, "prompt": text}

        requests_module = self._ensure_requests()

        try:
            response = requests_module.post(
                endpoint,
                json=payload,
                timeout=self.settings.ollama_embed_timeout,
            )
        except requests_module.RequestException as exc:  # pragma: no cover - network errors
            raise EmbeddingServiceError("Verbindung zu Ollama fehlgeschlagen.") from exc

        if response.status_code >= 400:
            raise EmbeddingServiceError(
                f"Ollama antwortete mit Status {response.status_code}: {response.text}"
            )

        data = response.json()
        vector = self._extract_vector(data)
        return EmbeddingResponse(vector=vector, model=self.settings.ollama_embed_model, dimensions=len(vector))

    def _generate_via_openai(self, text: str) -> EmbeddingResponse:
        base_url = self.settings.openai_base_url.rstrip("/")
        endpoint = f"{base_url}/embeddings"
        payload = {"model": self.settings.openai_embed_model, "input": text}

        requests_module = self._ensure_requests()
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        if self.settings.openai_organization:
            headers["OpenAI-Organization"] = self.settings.openai_organization

        try:
            response = requests_module.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=self.settings.openai_embed_timeout,
            )
        except requests_module.RequestException as exc:  # pragma: no cover - network errors
            raise EmbeddingServiceError("Verbindung zur OpenAI Embedding-API fehlgeschlagen.") from exc

        if response.status_code >= 400:
            raise EmbeddingServiceError(
                f"OpenAI antwortete mit Status {response.status_code}: {response.text}"
            )

        data = response.json()
        try:
            vector = list(data["data"][0]["embedding"])
        except (KeyError, IndexError, TypeError) as exc:
            raise EmbeddingServiceError("Ungültige Embedding-Antwort von OpenAI erhalten.") from exc

        return EmbeddingResponse(
            vector=vector,
            model=self.settings.openai_embed_model,
            dimensions=len(vector),
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _ensure_requests(self):
        if self._requests is None:
            try:
                import requests as requests_module  # type: ignore
            except ModuleNotFoundError as exc:  # pragma: no cover - defensive
                raise EmbeddingServiceError("Das 'requests'-Paket wird für Embedding-Aufrufe benötigt.") from exc
            self._requests = requests_module
        return self._requests

    @staticmethod
    def _extract_vector(payload: dict) -> List[float]:
        if "embedding" in payload:
            return [float(x) for x in payload["embedding"]]

        embeddings = payload.get("embeddings") or payload.get("data")
        if embeddings:
            first = embeddings[0]
            if isinstance(first, dict):
                vector = first.get("embedding")
            else:
                vector = first
            if vector is not None:
                return [float(x) for x in vector]

        raise EmbeddingServiceError("Embedding-Vektor konnte nicht extrahiert werden.")

    @staticmethod
    def _fake_embedding(text: str) -> List[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        vector = []
        # Use 16 bytes → 8 deterministic pseudo-random floats in range [-1, 1].
        for index in range(0, 16, 2):
            segment = digest[index : index + 2]
            value = int.from_bytes(segment, "big", signed=False)
            normalized = (value / 65535.0) * 2 - 1
            vector.append(round(normalized, 6))
        return vector


def serialize_embedding(vector: Optional[Iterable[float]]) -> Optional[str]:
    """Serialize an embedding vector into JSON."""

    if vector is None:
        return None
    return json.dumps([float(x) for x in vector])


def deserialize_embedding(payload: Optional[str]) -> Optional[List[float]]:
    """Deserialize an embedding vector from JSON."""

    if not payload:
        return None
    try:
        loaded = json.loads(payload)
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive
        raise EmbeddingServiceError("Gespeicherter Embedding-Vektor ist kein gültiges JSON.") from exc

    if not isinstance(loaded, list):
        raise EmbeddingServiceError("Gespeicherter Embedding-Vektor hat ein ungültiges Format.")

    return [float(x) for x in loaded]


__all__ = [
    "EmbeddingResponse",
    "EmbeddingService",
    "EmbeddingServiceError",
    "deserialize_embedding",
    "serialize_embedding",
]
