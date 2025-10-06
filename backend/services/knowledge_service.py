"""Services for building and managing knowledge chunks from parsed documents."""

from __future__ import annotations

import logging
from typing import Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from backend.models import (
    Dokument,
    DokumentMetadata,
    KnowledgeChunk,
    KnowledgeChunkTypeEnum,
)
from backend.services.rag_service import EmbeddingService, EmbeddingServiceError, serialize_embedding


logger = logging.getLogger(__name__)


class KnowledgeBuilder:
    """Creates structured knowledge chunks from parsed document metadata."""

    def __init__(
        self,
        db: Session,
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
        dokument: Dokument,
        metadata: Optional[DokumentMetadata],
    ) -> List[KnowledgeChunk]:
        """Generates chunk objects without persisting them."""

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

    def persist_chunks(self, chunks: Iterable[KnowledgeChunk]) -> None:
        """Persists the provided chunk objects within the associated session."""

        for chunk in chunks:
            self.db.add(chunk)

    def _create_chunk(
        self,
        dokument: Dokument,
        chunk_index: int,
        chunk_type: KnowledgeChunkTypeEnum,
        chunk_text: str,
        source_reference: Optional[Dict[str, object]] = None,
    ) -> KnowledgeChunk:
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

        chunks: List[str] = []
        start = 0
        while start < len(normalized):
            end = start + self.max_chunk_chars
            chunk = normalized[start:end]
            chunks.append(chunk)
            start = max(end - self.chunk_overlap, end)

        return chunks

    def _iter_table_chunks(self, tabellen_daten: Iterable[dict]) -> Iterable[Dict[str, object]]:
        for index, table in enumerate(tabellen_daten):
            header_lookup: List[object] = []
            rows: Iterable[object]

            if isinstance(table, dict):
                raw_headers = table.get("headers") or []
                if isinstance(raw_headers, (list, tuple)):
                    header_lookup = list(raw_headers)
                elif raw_headers:
                    header_lookup = [raw_headers]
                rows = table.get("rows") or table.get("data") or []
            elif isinstance(table, (list, tuple)):
                if not table:
                    continue
                first_row = table[0]
                if isinstance(first_row, (list, tuple)):
                    header_lookup = list(first_row)
                    rows = table[1:]
                else:
                    rows = table
            else:
                continue

            headers = [self._stringify_cell(cell) for cell in header_lookup]
            lines: List[str] = []

            if headers and any(header.strip() for header in headers):
                lines.append(" | ".join(headers))
            else:
                headers = []

            for row in rows or []:
                if isinstance(row, dict):
                    if header_lookup:
                        raw_values = [row.get(header, "") for header in header_lookup]
                    else:
                        raw_values = list(row.values())
                elif isinstance(row, (list, tuple)):
                    raw_values = list(row)
                else:
                    continue

                row_values = [self._stringify_cell(value) for value in raw_values]
                if not any(value.strip() for value in row_values):
                    continue

                lines.append(" | ".join(row_values))

            if not lines:
                continue

            table_text = "\n".join(lines)

            yield {
                "text": table_text,
                "metadata": {"source": "table", "table_index": index, "headers": headers},
            }

    @staticmethod
    def _stringify_cell(value: object) -> str:
        if value is None:
            return ""
        return str(value).strip()
