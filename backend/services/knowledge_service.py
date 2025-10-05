"""Services for building and persisting project knowledge chunks."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Iterator, List, Optional, Protocol, Sequence, TYPE_CHECKING

from backend.core.config import Settings, get_settings
from backend.services.rag_service import (
    EmbeddingService,
    EmbeddingServiceError,
    deserialize_embedding,
    serialize_embedding,
)


if TYPE_CHECKING:  # pragma: no cover - typing helpers only
    from backend.models import (
        Dokument as DokumentModel,
        DokumentMetadata as DokumentMetadataModel,
        KnowledgeChunk as KnowledgeChunkModel,
        KnowledgeChunkTypeEnum as KnowledgeChunkTypeEnum,
    )


logger = logging.getLogger(__name__)


class VectorStore(Protocol):
    """Protocol describing the vector store interface used by knowledge sync."""

    def ensure_collection(self, vector_dim: int) -> None:  # pragma: no cover - interface
        ...

    def upsert_embeddings(self, points: Sequence[Dict[str, Any]]) -> None:  # pragma: no cover - interface
        ...


@dataclass
class ChunkDraft:
    chunk_index: int
    chunk_type: "KnowledgeChunkTypeEnum"
    chunk_text: str
    source_reference: Dict[str, Any]


class KnowledgeBuilder:
    """Creates structured knowledge chunks from parsed document metadata."""

    def __init__(
        self,
        db: Any,
        embedding_service: Optional[EmbeddingService] = None,
        *,
        vector_store: Optional[VectorStore] = None,
        max_chunk_chars: int = 1200,
        chunk_overlap: int = 150,
        settings: Optional[Settings] = None,
    ) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.embedding_service = embedding_service or EmbeddingService.from_env()
        self.vector_store = vector_store
        self.max_chunk_chars = max_chunk_chars
        self.chunk_overlap = chunk_overlap

        if self.chunk_overlap < 0:
            raise ValueError("chunk_overlap must be non-negative")

    def build_chunks(
        self,
        dokument: "DokumentModel",
        metadata: Optional["DokumentMetadataModel"],
    ) -> List["KnowledgeChunkModel"]:
        """Generates chunk model instances without persisting them."""

        from backend.models import KnowledgeChunk, KnowledgeChunkTypeEnum

        if metadata is None:
            logger.debug(
                "Keine Metadaten für Dokument %s verfügbar – Knowledge-Building übersprungen.",
                dokument.id,
            )
            return []

        drafts = list(self._iter_drafts(metadata))
        chunks: List[KnowledgeChunk] = []

        for draft in drafts:
            chunk = self._create_chunk(
                dokument=dokument,
                chunk_index=draft.chunk_index,
                chunk_type=draft.chunk_type,
                chunk_text=draft.chunk_text,
                source_reference=draft.source_reference,
            )
            if chunk is not None:
                chunks.append(chunk)

        logger.info("%s Wissenseinträge für Dokument %s erzeugt", len(chunks), dokument.id)
        return chunks

    def persist_chunks(self, chunks: Iterable["KnowledgeChunkModel"]) -> List["KnowledgeChunkModel"]:
        """Persists the provided chunk objects and returns them."""

        persisted: List["KnowledgeChunkModel"] = []
        for chunk in chunks:
            self.db.add(chunk)
            persisted.append(chunk)

        if not persisted:
            return []

        # Ensure IDs are assigned before syncing with the vector store
        if hasattr(self.db, "flush"):
            self.db.flush()

        self._sync_vector_store(persisted)
        return persisted

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------
    def _iter_drafts(self, metadata: "DokumentMetadataModel") -> Iterator[ChunkDraft]:
        from backend.models import KnowledgeChunkTypeEnum

        chunk_index = 0

        for text_chunk in self._split_text(metadata.extrahierter_text or ""):
            if not text_chunk.strip():
                continue
            yield ChunkDraft(
                chunk_index=chunk_index,
                chunk_type=KnowledgeChunkTypeEnum.TEXT,
                chunk_text=text_chunk.strip(),
                source_reference={"source": "text"},
            )
            chunk_index += 1

        for table_chunk in self._iter_table_chunks(metadata.tabellen_daten or []):
            if not table_chunk["text"].strip():
                continue
            yield ChunkDraft(
                chunk_index=chunk_index,
                chunk_type=KnowledgeChunkTypeEnum.TABLE,
                chunk_text=table_chunk["text"].strip(),
                source_reference=table_chunk["metadata"],
            )
            chunk_index += 1

    def _create_chunk(
        self,
        dokument: "DokumentModel",
        chunk_index: int,
        chunk_type: "KnowledgeChunkTypeEnum",
        chunk_text: str,
        source_reference: Optional[Dict[str, Any]] = None,
    ) -> Optional["KnowledgeChunkModel"]:
        from backend.models import KnowledgeChunk

        embedding_vector: Optional[List[float]] = None
        embedding_model: Optional[str] = None
        embedding_dimensions: Optional[int] = None

        if self.embedding_service:
            try:
                response = self.embedding_service.generate(chunk_text)
                embedding_vector = response.vector
                embedding_model = response.model
                embedding_dimensions = response.dimensions
            except EmbeddingServiceError as exc:
                logger.warning("Embedding-Generierung fehlgeschlagen: %s", exc)

        chunk = KnowledgeChunk(
            projekt_id=dokument.projekt_id,
            dokument_id=dokument.id,
            chunk_index=chunk_index,
            chunk_type=chunk_type,
            chunk_text=chunk_text,
            source_reference=source_reference or {},
            embedding_model=embedding_model,
            embedding_vector=serialize_embedding(embedding_vector),
            embedding_dimensions=embedding_dimensions,
        )
        return chunk

    def _split_text(self, text: str) -> List[str]:
        if not text:
            return []

        normalized = " ".join(text.split())
        if len(normalized) <= self.max_chunk_chars:
            return [normalized]

        if self.chunk_overlap >= self.max_chunk_chars:
            raise ValueError("chunk_overlap must be smaller than max_chunk_chars")

        chunks: List[str] = []
        start = 0
        text_length = len(normalized)

        while start < text_length:
            end = min(start + self.max_chunk_chars, text_length)
            chunk = normalized[start:end]
            if chunk:
                chunks.append(chunk)

            if end >= text_length:
                break

            start = max(end - self.chunk_overlap, 0)

        return chunks

    def _iter_table_chunks(self, tabellen_daten: Iterable[dict]) -> Iterator[Dict[str, Any]]:
        for index, table in enumerate(tabellen_daten):
            headers = table.get("headers") or []
            rows = table.get("rows") or table.get("data") or []

            if not rows:
                continue

            lines: List[str] = []
            if headers:
                lines.append(" | ".join(str(h) for h in headers))

            for row in rows:
                if isinstance(row, dict):
                    row_values = [str(row.get(h, "")) for h in headers]
                else:
                    row_values = [str(cell) for cell in row]
                lines.append(" | ".join(row_values))

            if not lines:
                continue

            table_text = "\n".join(lines)

            yield {
                "text": table_text,
                "metadata": {"source": "table", "table_index": index, "headers": headers},
            }

    def _sync_vector_store(self, chunks: Sequence["KnowledgeChunkModel"]) -> None:
        if not self.vector_store:
            return

        vectors: List[Dict[str, Any]] = []
        for chunk in chunks:
            if not chunk.embedding_vector:
                continue
            vector = deserialize_embedding(chunk.embedding_vector)
            if not vector:
                continue
            vectors.append(
                {
                    "id": chunk.id,
                    "vector": vector,
                    "payload": {
                        "projekt_id": chunk.projekt_id,
                        "dokument_id": chunk.dokument_id,
                        "chunk_index": chunk.chunk_index,
                        "chunk_type": chunk.chunk_type.value,
                        "source_reference": chunk.source_reference,
                    },
                }
            )

        if not vectors:
            return

        vector_dim = len(vectors[0]["vector"])

        try:
            self.vector_store.ensure_collection(vector_dim)
        except Exception as exc:  # pragma: no cover - external service failure
            logger.warning("Vectorstore-Synchronisierung übersprungen: %s", exc)
            return

        try:
            self.vector_store.upsert_embeddings(vectors)
        except Exception as exc:  # pragma: no cover - external service failure
            logger.warning("Vectorstore-Upsert fehlgeschlagen: %s", exc)


__all__ = ["KnowledgeBuilder", "VectorStore", "ChunkDraft"]
