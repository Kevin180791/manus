"""
Service layer for project management
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from models import Projekt, ProjectTypeEnum, LeistungsPhaseEnum
from database import get_db

logger = logging.getLogger(__name__)

class ProjektService:
    """Service for project operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def erstelle_projekt(
        self, 
        name: str, 
        typ: str, 
        leistungsphase: str,
        beschreibung: Optional[str] = None
    ) -> Projekt:
        """
        Erstellt ein neues Projekt
        """
        try:
            # Konvertiere String zu Enum
            projekt_typ = ProjectTypeEnum(typ)
            lp = LeistungsPhaseEnum(leistungsphase)
            
            projekt = Projekt(
                name=name,
                typ=projekt_typ,
                leistungsphase=lp,
                beschreibung=beschreibung
            )
            
            self.db.add(projekt)
            self.db.commit()
            self.db.refresh(projekt)
            
            logger.info(f"Projekt erstellt: {projekt.id} - {name}")
            return projekt
            
        except ValueError as e:
            logger.error(f"Ungültiger Enum-Wert: {e}")
            raise ValueError(f"Ungültiger Projekt-Typ oder Leistungsphase: {e}")
        except Exception as e:
            logger.error(f"Fehler beim Erstellen des Projekts: {e}")
            self.db.rollback()
            raise
    
    def hole_projekt(self, projekt_id: str) -> Optional[Projekt]:
        """
        Holt ein Projekt anhand der ID
        """
        return self.db.query(Projekt).filter(Projekt.id == projekt_id).first()
    
    def hole_alle_projekte(self, limit: int = 100) -> List[Projekt]:
        """
        Holt alle Projekte (mit Limit)
        """
        return self.db.query(Projekt).order_by(Projekt.erstellt_am.desc()).limit(limit).all()
    
    def aktualisiere_projekt(
        self, 
        projekt_id: str, 
        name: Optional[str] = None,
        typ: Optional[str] = None,
        leistungsphase: Optional[str] = None,
        beschreibung: Optional[str] = None
    ) -> Optional[Projekt]:
        """
        Aktualisiert ein bestehendes Projekt
        """
        projekt = self.hole_projekt(projekt_id)
        if not projekt:
            return None
        
        try:
            if name is not None:
                projekt.name = name
            if typ is not None:
                projekt.typ = ProjectTypeEnum(typ)
            if leistungsphase is not None:
                projekt.leistungsphase = LeistungsPhaseEnum(leistungsphase)
            if beschreibung is not None:
                projekt.beschreibung = beschreibung
            
            projekt.aktualisiert_am = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(projekt)
            
            logger.info(f"Projekt aktualisiert: {projekt_id}")
            return projekt
            
        except ValueError as e:
            logger.error(f"Ungültiger Enum-Wert: {e}")
            self.db.rollback()
            raise ValueError(f"Ungültiger Projekt-Typ oder Leistungsphase: {e}")
        except Exception as e:
            logger.error(f"Fehler beim Aktualisieren des Projekts: {e}")
            self.db.rollback()
            raise
    
    def loesche_projekt(self, projekt_id: str) -> bool:
        """
        Löscht ein Projekt (und alle zugehörigen Daten)
        """
        projekt = self.hole_projekt(projekt_id)
        if not projekt:
            return False
        
        try:
            self.db.delete(projekt)
            self.db.commit()
            
            logger.info(f"Projekt gelöscht: {projekt_id}")
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Löschen des Projekts: {e}")
            self.db.rollback()
            raise
    
    def hole_projekt_statistiken(self, projekt_id: str) -> Optional[dict]:
        """
        Holt Statistiken für ein Projekt
        """
        projekt = self.hole_projekt(projekt_id)
        if not projekt:
            return None
        
        return {
            "projekt_id": projekt.id,
            "name": projekt.name,
            "typ": projekt.typ.value,
            "leistungsphase": projekt.leistungsphase.value,
            "anzahl_dokumente": len(projekt.dokumente),
            "anzahl_pruefauftraege": len(projekt.pruefauftraege),
            "letzter_pruefauftrag": (
                max(projekt.pruefauftraege, key=lambda x: x.erstellt_am).erstellt_am
                if projekt.pruefauftraege else None
            ),
            "erstellt_am": projekt.erstellt_am,
            "aktualisiert_am": projekt.aktualisiert_am
        }

# Dependency function for FastAPI
def get_projekt_service(db: Session = next(get_db())) -> ProjektService:
    """
    FastAPI dependency to get ProjektService
    """
    return ProjektService(db)

