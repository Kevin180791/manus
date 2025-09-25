"""
SQLAlchemy models for TGA platform
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSON
from database import Base
from datetime import datetime
import uuid
import enum

# Enums für Datenbank
class ProjectTypeEnum(enum.Enum):
    RESIDENTIAL = "wohngebaeude"
    OFFICE = "buerogebaeude"
    INDUSTRIAL = "industriebau"
    HOSPITAL = "krankenhaus"
    SCHOOL = "schule"
    MIXED_USE = "mischnutzung"

class LeistungsPhaseEnum(enum.Enum):
    LP1 = "grundlagenermittlung"
    LP2 = "vorplanung"
    LP3 = "entwurfsplanung"
    LP4 = "genehmigungsplanung"
    LP5 = "ausfuehrungsplanung"
    LP6 = "vorbereitung_vergabe"
    LP7 = "mitwirken_vergabe"
    LP8 = "objektueberwachung"
    LP9 = "objektbetreuung"

class GewerkeTypeEnum(enum.Enum):
    KG410_SANITAER = "kg410_sanitaer"
    KG420_HEIZUNG = "kg420_heizung"
    KG430_LUEFTUNG = "kg430_lueftung"
    KG440_ELEKTRO = "kg440_elektro"
    KG450_KOMMUNIKATION = "kg450_kommunikation"
    KG474_FEUERLOESCHUNG = "kg474_feuerloeschung"
    KG480_AUTOMATION = "kg480_automation"

class PruefStatusEnum(enum.Enum):
    ERSTELLT = "erstellt"
    LAUFEND = "laufend"
    ABGESCHLOSSEN = "abgeschlossen"
    FEHLER = "fehler"

class PrioritaetEnum(enum.Enum):
    HOCH = "hoch"
    MITTEL = "mittel"
    NIEDRIG = "niedrig"

class KategorieEnum(enum.Enum):
    FORMAL = "formal"
    TECHNISCH = "technisch"
    KOORDINATION = "koordination"

# Database Models
class Projekt(Base):
    __tablename__ = "projekte"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    typ = Column(SQLEnum(ProjectTypeEnum), nullable=False)
    leistungsphase = Column(SQLEnum(LeistungsPhaseEnum), nullable=False)
    beschreibung = Column(Text)
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    dokumente = relationship("Dokument", back_populates="projekt", cascade="all, delete-orphan")
    pruefauftraege = relationship("PruefAuftrag", back_populates="projekt", cascade="all, delete-orphan")

class Dokument(Base):
    __tablename__ = "dokumente"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    document_type = Column(String, nullable=False)  # "plan", "berechnung", "schema", "bericht"
    gewerk = Column(SQLEnum(GewerkeTypeEnum), nullable=False)
    plan_nummer = Column(String)
    revision = Column(String)
    file_size = Column(Integer)  # in bytes
    mime_type = Column(String)
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    
    # Relationships
    projekt = relationship("Projekt", back_populates="dokumente")
    metadaten = relationship("DokumentMetadata", back_populates="dokument", uselist=False, cascade="all, delete-orphan")

class DokumentMetadata(Base):
    __tablename__ = "dokument_metadaten"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    extrahierter_text = Column(Text)
    tabellen_daten = Column(JSON)  # Strukturierte Tabellendaten
    plan_metadaten = Column(JSON)  # Plan-Nummer, Revision, Datum, etc.
    heizlast_daten = Column(JSON)  # Extrahierte Heizlastdaten
    luftmengen_daten = Column(JSON)  # Extrahierte Luftmengendaten
    verarbeitet_am = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    dokument_id = Column(String, ForeignKey("dokumente.id"), nullable=False)
    
    # Relationships
    dokument = relationship("Dokument", back_populates="metadaten")

class PruefAuftrag(Base):
    __tablename__ = "pruefauftraege"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(SQLEnum(PruefStatusEnum), default=PruefStatusEnum.ERSTELLT)
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    gestartet_am = Column(DateTime)
    abgeschlossen_am = Column(DateTime)
    fehler_nachricht = Column(Text)
    
    # Prüfstatistiken
    anzahl_dokumente = Column(Integer, default=0)
    anzahl_befunde = Column(Integer, default=0)
    
    # Foreign Keys
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    
    # Relationships
    projekt = relationship("Projekt", back_populates="pruefauftraege")
    befunde = relationship("Befund", back_populates="pruefauftrag", cascade="all, delete-orphan")

class Befund(Base):
    __tablename__ = "befunde"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    titel = Column(String, nullable=False)
    beschreibung = Column(Text, nullable=False)
    kategorie = Column(SQLEnum(KategorieEnum), nullable=False)
    prioritaet = Column(SQLEnum(PrioritaetEnum), nullable=False)
    gewerk = Column(SQLEnum(GewerkeTypeEnum), nullable=False)
    
    # Referenzen
    norm_referenz = Column(String)
    plan_referenz = Column(String)
    empfehlung = Column(Text)
    
    # Metadaten
    agent_quelle = Column(String, nullable=False)  # Welcher Agent hat den Befund erstellt
    konfidenz_score = Column(Float, default=0.0)
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    
    # Optional: Bezug zu spezifischem Dokument
    dokument_id = Column(String, ForeignKey("dokumente.id"))
    
    # Foreign Keys
    pruefauftrag_id = Column(String, ForeignKey("pruefauftraege.id"), nullable=False)
    
    # Relationships
    pruefauftrag = relationship("PruefAuftrag", back_populates="befunde")
    dokument = relationship("Dokument")

class PruefProtokoll(Base):
    __tablename__ = "pruefprotokolle"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_name = Column(String, nullable=False)
    aktion = Column(String, nullable=False)  # "dokument_analysiert", "befund_erstellt", etc.
    details = Column(JSON)  # Zusätzliche Details zur Aktion
    dauer_ms = Column(Integer)  # Ausführungsdauer in Millisekunden
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    pruefauftrag_id = Column(String, ForeignKey("pruefauftraege.id"), nullable=False)
    
    # Relationships
    pruefauftrag = relationship("PruefAuftrag")

# Utility Models für Konfiguration
class SystemKonfiguration(Base):
    __tablename__ = "system_konfiguration"
    
    id = Column(String, primary_key=True)
    wert = Column(JSON)
    beschreibung = Column(Text)
    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NormReferenz(Base):
    __tablename__ = "norm_referenzen"
    
    id = Column(String, primary_key=True)  # z.B. "DIN_EN_12831_1"
    titel = Column(String, nullable=False)
    beschreibung = Column(Text)
    version = Column(String)
    gueltig_ab = Column(DateTime)
    gueltig_bis = Column(DateTime)
    url = Column(String)
    gewerke = Column(JSON)  # Liste der relevanten Gewerke
    gebaeude_typen = Column(JSON)  # Liste der relevanten Gebäudetypen
    erstellt_am = Column(DateTime, default=datetime.utcnow)

