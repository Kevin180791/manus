"""Services for embedding generation and knowledge retrieval support."""

from __future__ import annotations

import importlib
import importlib.util
import json
import logging
import os
from dataclasses import dataclass
from typing import List, Optional


logger = logging.getLogger(__name__)


class EmbeddingServiceError(RuntimeError):
    """Base error for embedding service failures."""


@dataclass
class EmbeddingResponse:
    vector: List[float]
    model: str


class EmbeddingService:
    """Simple wrapper for generating embeddings via Ollama's REST API."""

    def __init__(self, base_url: str, model_name: str, timeout: float = 15.0) -> None:
        if not base_url:
            raise ValueError("base_url darf nicht leer sein")

        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout

    @classmethod
    def from_env(cls) -> Optional["EmbeddingService"]:
        """Factory that builds a service instance from environment variables."""

        base_url = os.getenv("OLLAMA_BASE_URL")
        if not base_url:
            return None

        model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        timeout_env = os.getenv("OLLAMA_EMBED_TIMEOUT")
        timeout = float(timeout_env) if timeout_env else 15.0
        try:
            return cls(base_url=base_url, model_name=model, timeout=timeout)
        except ValueError:
            logger.warning("EmbeddingService konnte nicht initialisiert werden (fehlende Konfiguration).")
            return None

    def generate(self, text: str) -> EmbeddingResponse:
        """Generates an embedding for the provided text."""

        endpoint = f"{self.base_url}/api/embeddings"
        payload = {"model": self.model_name, "prompt": text}

        if importlib.util.find_spec("requests") is None:
            raise EmbeddingServiceError("Das 'requests'-Paket wird für Embedding-Aufrufe benötigt.")

        requests_module = importlib.import_module("requests")

        try:
            response = requests_module.post(endpoint, json=payload, timeout=self.timeout)
        except requests_module.RequestException as exc:  # pragma: no cover - network issues
            raise EmbeddingServiceError("Verbindung zum Ollama Embedding-Service fehlgeschlagen.") from exc

        if response.status_code >= 400:
            raise EmbeddingServiceError(
                f"Embedding-Service antwortete mit Status {response.status_code}: {response.text}"
            )

        data = response.json()
        vector = self._extract_vector(data)
        return EmbeddingResponse(vector=vector, model=self.model_name)

    @staticmethod
    def _extract_vector(payload: dict) -> List[float]:
        """Extracts the embedding vector from an Ollama response."""

        if "embedding" in payload:
            return list(payload["embedding"])  # type: ignore[arg-type]

        if "embeddings" in payload and payload["embeddings"]:
            return list(payload["embeddings"][0])  # type: ignore[index]

        raise EmbeddingServiceError("Embedding-Vektor im Ollama-Response nicht gefunden.")


def serialize_embedding(vector: Optional[List[float]]) -> Optional[str]:
    """Serializes an embedding vector for persistence."""

    if vector is None:
        return None

    return json.dumps(vector)


def deserialize_embedding(payload: Optional[str]) -> Optional[List[float]]:
    """Deserializes an embedding vector from the database."""

    if not payload:
        return None

    try:
        loaded = json.loads(payload)
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive
        raise EmbeddingServiceError("Gespeicherter Embedding-Vektor ist kein gültiges JSON.") from exc

    if not isinstance(loaded, list):
        raise EmbeddingServiceError("Gespeicherter Embedding-Vektor hat ein ungültiges Format.")

    return [float(x) for x in loaded]
