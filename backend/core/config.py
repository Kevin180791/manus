"""Central configuration utilities for backend services."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional


def _get_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_float(value: Optional[str], default: float) -> float:
    try:
        return float(value) if value is not None else default
    except ValueError:
        return default


def _get_int(value: Optional[str], default: int) -> int:
    try:
        return int(value) if value is not None else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Runtime configuration derived from environment variables."""

    ollama_base_url: Optional[str]
    ollama_embed_model: str
    ollama_embed_timeout: float

    openai_api_key: Optional[str]
    openai_organization: Optional[str]
    openai_base_url: str
    openai_embed_model: str
    openai_embed_timeout: float

    rag_vector_dim: int
    rag_collection_name: str
    rag_auto_wipe_on_mismatch: bool

    qdrant_url: Optional[str]
    qdrant_api_key: Optional[str]
    qdrant_timeout: float

    test_mode: bool


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns cached application settings."""

    return Settings(
        ollama_base_url=os.getenv("OLLAMA_BASE_URL"),
        ollama_embed_model=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        ollama_embed_timeout=_get_float(os.getenv("OLLAMA_EMBED_TIMEOUT"), 15.0),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_organization=os.getenv("OPENAI_ORGANIZATION"),
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        openai_embed_model=os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small"),
        openai_embed_timeout=_get_float(os.getenv("OPENAI_EMBED_TIMEOUT"), 15.0),
        rag_vector_dim=_get_int(os.getenv("RAG_VECTOR_DIM"), 1536),
        rag_collection_name=os.getenv("RAG_COLLECTION_NAME", "project_knowledge"),
        rag_auto_wipe_on_mismatch=_get_bool(os.getenv("RAG_AUTO_WIPE_ON_MISMATCH"), False),
        qdrant_url=os.getenv("QDRANT_URL"),
        qdrant_api_key=os.getenv("QDRANT_API_KEY"),
        qdrant_timeout=_get_float(os.getenv("QDRANT_TIMEOUT"), 5.0),
        test_mode=_get_bool(os.getenv("TEST_MODE"), False),
    )


__all__ = ["Settings", "get_settings"]
