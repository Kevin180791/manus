"""
Service layer for document management
"""

import os
import shutil
from pathlib import Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from backend.models import Dokument, DokumentMetadata, GewerkeTypeEnum
from backend.agent_core.document_parser import DocumentParser
from backend.services.knowledge_service import KnowledgeBuilder

logger = logging.getLogger(__name__)

class DokumentService:
    """Service for document operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.parser = DocumentParser()
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(exist_ok=True)
        self.knowledge_builder = KnowledgeBuilder(db)
    
    def speichere_dokument(
        self,
        projekt_id: str,
        file_content: bytes,
        filename: str,
        document_type: str,
        gewerk: str,
        plan_nummer: Optional[str] = None,
        revision: Optional[str] = None
    ) -> Dokument:
        """
        Speichert ein Dokument und extrahiert Metadaten
        """
        try:
            # Konvertiere Gewerk zu Enum
            gewerk_enum = GewerkeTypeEnum(gewerk)
            
            # Erstelle sicheren Dateinamen
            safe_filename = self._create_safe_filename(filename)
            file_path = self.upload_dir / safe_filename
            
            # Speichere Datei
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Erstelle Dokument-Eintrag
            dokument = Dokument(
                filename=filename,
                file_path=str(file_path),
                document_type=document_type,
                gewerk=gewerk_enum,
                plan_nummer=plan_nummer,
                revision=revision,
                file_size=len(file_content),
                mime_type=self._get_mime_type(filename),
                projekt_id=projekt_id
            )
            
            self.db.add(dokument)
            self.db.flush()  # Flush to get ID
            
            # Extrahiere Metadaten asynchron
            metadaten = self._extrahiere_metadaten(dokument)
            if metadaten:
                self.db.add(metadaten)

            # Knowledge-Chunks vorbereiten, bevor der Commit erfolgt
            knowledge_chunks = self.knowledge_builder.build_chunks(dokument, metadaten)
            if knowledge_chunks:
                self.knowledge_builder.persist_chunks(knowledge_chunks)

            self.db.commit()
            self.db.refresh(dokument)
            
            logger.info(f"Dokument gespeichert: {dokument.id} - {filename}")
            return dokument
            
        except ValueError as e:
            logger.error(f"Ungültiger Gewerk-Typ: {e}")
            # Lösche Datei falls erstellt
            if 'file_path' in locals() and file_path.exists():
                file_path.unlink()
            raise ValueError(f"Ungültiger Gewerk-Typ: {e}")
        except Exception as e:
            logger.error(f"Fehler beim Speichern des Dokuments: {e}")
            self.db.rollback()
            # Lösche Datei falls erstellt
            if 'file_path' in locals() and file_path.exists():
                file_path.unlink()
            raise
    
    def hole_dokument(self, dokument_id: str) -> Optional[Dokument]:
        """
        Holt ein Dokument anhand der ID
        """
        return self.db.query(Dokument).filter(Dokument.id == dokument_id).first()
    
    def hole_projekt_dokumente(self, projekt_id: str) -> List[Dokument]:
        """
        Holt alle Dokumente eines Projekts
        """
        return self.db.query(Dokument).filter(Dokument.projekt_id == projekt_id).all()
    
    def hole_dokumente_nach_gewerk(self, projekt_id: str, gewerk: str) -> List[Dokument]:
        """
        Holt Dokumente eines Projekts nach Gewerk
        """
        gewerk_enum = GewerkeTypeEnum(gewerk)
        return self.db.query(Dokument).filter(
            Dokument.projekt_id == projekt_id,
            Dokument.gewerk == gewerk_enum
        ).all()
    
    def loesche_dokument(self, dokument_id: str) -> bool:
        """
        Löscht ein Dokument (Datei und DB-Eintrag)
        """
        dokument = self.hole_dokument(dokument_id)
        if not dokument:
            return False
        
        try:
            # Lösche Datei
            file_path = Path(dokument.file_path)
            if file_path.exists():
                file_path.unlink()
            
            # Lösche DB-Eintrag
            self.db.delete(dokument)
            self.db.commit()
            
            logger.info(f"Dokument gelöscht: {dokument_id}")
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Löschen des Dokuments: {e}")
            self.db.rollback()
            raise
    
    def hole_dokument_metadaten(self, dokument_id: str) -> Optional[DokumentMetadata]:
        """
        Holt Metadaten eines Dokuments
        """
        return self.db.query(DokumentMetadata).filter(
            DokumentMetadata.dokument_id == dokument_id
        ).first()
    
    def _extrahiere_metadaten(self, dokument: Dokument) -> Optional[DokumentMetadata]:
        """
        Extrahiert Metadaten aus einem Dokument
        """
        try:
            if not self.parser.can_parse(dokument.file_path):
                logger.warning(f"Cannot parse document: {dokument.filename}")
                return None
            
            # Extrahiere Text
            text = self.parser.extract_text(dokument.file_path)
            
            # Extrahiere Tabellen
            tabellen = self.parser.extract_tables(dokument.file_path)
            
            # Extrahiere Plan-Metadaten
            plan_metadaten = self.parser.extract_metadata(dokument.file_path)
            
            # Gewerk-spezifische Extraktion
            heizlast_daten = None
            luftmengen_daten = None
            
            if dokument.gewerk == GewerkeTypeEnum.KG420_HEIZUNG:
                heizlast_daten = self.parser.find_heizlast_data(dokument.file_path)
            elif dokument.gewerk == GewerkeTypeEnum.KG430_LUEFTUNG:
                luftmengen_daten = self.parser.find_luftmengen_data(dokument.file_path)
            
            metadaten = DokumentMetadata(
                dokument_id=dokument.id,
                extrahierter_text=text,
                tabellen_daten=tabellen,
                plan_metadaten=plan_metadaten,
                heizlast_daten=heizlast_daten,
                luftmengen_daten=luftmengen_daten
            )
            
            logger.info(f"Metadaten extrahiert für: {dokument.filename}")
            return metadaten
            
        except Exception as e:
            logger.error(f"Fehler bei Metadaten-Extraktion: {e}")
            return None
    
    def _create_safe_filename(self, filename: str) -> str:
        """
        Erstellt einen sicheren Dateinamen
        """
        # Entferne gefährliche Zeichen
        safe_name = "".join(c for c in filename if c.isalnum() or c in ".-_")
        
        # Füge Timestamp hinzu um Kollisionen zu vermeiden
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(safe_name)
        
        return f"{timestamp}_{name}{ext}"
    
    def _get_mime_type(self, filename: str) -> str:
        """
        Bestimmt MIME-Type basierend auf Dateiendung
        """
        ext = Path(filename).suffix.lower()
        mime_types = {
            '.pdf': 'application/pdf',
            '.dwg': 'application/acad',
            '.dxf': 'application/dxf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain'
        }
        return mime_types.get(ext, 'application/octet-stream')
    
    def hole_dokument_statistiken(self, projekt_id: str) -> Dict[str, Any]:
        """
        Holt Statistiken für Dokumente eines Projekts
        """
        dokumente = self.hole_projekt_dokumente(projekt_id)
        
        gewerk_counts = {}
        type_counts = {}
        total_size = 0
        
        for dok in dokumente:
            # Gewerk-Statistiken
            gewerk_key = dok.gewerk.value
            gewerk_counts[gewerk_key] = gewerk_counts.get(gewerk_key, 0) + 1
            
            # Typ-Statistiken
            type_counts[dok.document_type] = type_counts.get(dok.document_type, 0) + 1
            
            # Größe
            total_size += dok.file_size or 0
        
        return {
            "anzahl_dokumente": len(dokumente),
            "gewerk_verteilung": gewerk_counts,
            "typ_verteilung": type_counts,
            "gesamtgroesse_mb": round(total_size / (1024 * 1024), 2),
            "letztes_upload": (
                max(dokumente, key=lambda x: x.erstellt_am).erstellt_am
                if dokumente else None
            )
        }

