"""Services for building and managing knowledge chunks from parsed documents."""

from __future__ import annotations

import logging
from typing import Any, Dict, Iterable, List, Optional, TYPE_CHECKING

from backend.services.rag_service import EmbeddingService, EmbeddingServiceError, serialize_embedding


if TYPE_CHECKING:  # pragma: no cover - typing helpers only
    from backend.models import (
        Dokument as DokumentModel,
        DokumentMetadata as DokumentMetadataModel,
        KnowledgeChunk as KnowledgeChunkModel,
        KnowledgeChunkTypeEnum as KnowledgeChunkTypeEnum,
    )


logger = logging.getLogger(__name__)


class KnowledgeBuilder:
    """Creates structured knowledge chunks from parsed document metadata."""

    def __init__(
        self,
        db: Any,
        embedding_service: Optional[EmbeddingService] = None,
        max_chunk_chars: int = 1200,
        chunk_overlap: int = 150,
    ) -> None:
        self.db = db
        self.embedding_service = embedding_service or EmbeddingService.from_env()
        self.max_chunk_chars = max_chunk_chars
        self.chunk_overlap = chunk_overlap

    def build_chunks(
        self,
        dokument: "DokumentModel",
        metadata: Optional["DokumentMetadataModel"],
    ) -> List["KnowledgeChunkModel"]:
        """Generates chunk objects without persisting them."""

        from backend.models import KnowledgeChunkTypeEnum

        if metadata is None:
            logger.debug("Keine Metadaten für Dokument %s verfügbar – Knowledge-Building übersprungen.", dokument.id)
            return []

        chunk_index = 0
        chunks: List[KnowledgeChunk] = []

        for text_chunk in self._split_text(metadata.extrahierter_text or ""):
            if not text_chunk.strip():
                continue
            chunk = self._create_chunk(
                dokument=dokument,
                chunk_index=chunk_index,
                chunk_type=KnowledgeChunkTypeEnum.TEXT,
                chunk_text=text_chunk,
                source_reference={"source": "text"},
            )
            chunks.append(chunk)
            chunk_index += 1

        for table_chunk in self._iter_table_chunks(metadata.tabellen_daten or []):
            chunk = self._create_chunk(
                dokument=dokument,
                chunk_index=chunk_index,
                chunk_type=KnowledgeChunkTypeEnum.TABLE,
                chunk_text=table_chunk["text"],
                source_reference=table_chunk["metadata"],
            )
            chunks.append(chunk)
            chunk_index += 1

        logger.info("%s Wissenseinträge für Dokument %s erzeugt", len(chunks), dokument.id)
        return chunks

    def persist_chunks(self, chunks: Iterable["KnowledgeChunkModel"]) -> None:
        """Persists the provided chunk objects within the associated session."""

        for chunk in chunks:
            self.db.add(chunk)

    def _create_chunk(
        self,
        dokument: "DokumentModel",
        chunk_index: int,
        chunk_type: "KnowledgeChunkTypeEnum",
        chunk_text: str,
        source_reference: Optional[Dict[str, object]] = None,
    ) -> "KnowledgeChunkModel":
        from backend.models import KnowledgeChunk

        embedding_vector: Optional[List[float]] = None
        embedding_model: Optional[str] = None

        if self.embedding_service:
            try:
                response = self.embedding_service.generate(chunk_text)
                embedding_vector = response.vector
                embedding_model = response.model
            except EmbeddingServiceError as exc:
                logger.warning("Embedding-Generierung fehlgeschlagen: %s", exc)
        else:
            logger.debug("Kein Embedding-Service konfiguriert – Chunks werden ohne Vektor gespeichert.")

        chunk = KnowledgeChunk(
            projekt_id=dokument.projekt_id,
            dokument_id=dokument.id,
            chunk_index=chunk_index,
            chunk_type=chunk_type,
            chunk_text=chunk_text.strip(),
            source_reference=source_reference or {},
            embedding_model=embedding_model,
            embedding_vector=serialize_embedding(embedding_vector),
            embedding_dimensions=len(embedding_vector) if embedding_vector else None,
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

    def _iter_table_chunks(self, tabellen_daten: Iterable[dict]) -> Iterable[Dict[str, object]]:
        for index, table in enumerate(tabellen_daten):
            headers = table.get("headers") or []
            rows = table.get("rows") or table.get("data") or []

            if not rows:
                continue

            lines = []
            if headers:
                lines.append(" | ".join(str(h) for h in headers))

            for row in rows:
                if isinstance(row, dict):
                    row_values = [str(row.get(h, "")) for h in headers]
                else:
                    row_values = [str(cell) for cell in row]
                lines.append(" | ".join(row_values))

            table_text = "\n".join(lines)

            yield {
                "text": table_text,
                "metadata": {"source": "table", "table_index": index, "headers": headers},
            }
