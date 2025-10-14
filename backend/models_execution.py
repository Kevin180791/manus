"""
SQLAlchemy models for execution-focused features
Erweiterungen für ausführende Firmen
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from database import Base
from datetime import datetime
import uuid
import enum

# Neue Enums
class AusfuehrungsStatusEnum(enum.Enum):
    """Status der Ausführungsreife"""
    AUSFUEHRUNGSREIF = "ausfuehrungsreif"  # Grün
    KLAERUNGSBEDARF = "klaerungsbedarf"    # Gelb
    NICHT_AUSFUEHRUNGSREIF = "nicht_ausfuehrungsreif"  # Rot

class MaterialKategorieEnum(enum.Enum):
    """Kategorien für Materialien"""
    HEIZKOERPER = "heizkoerper"
    ROHRLEITUNGEN = "rohrleitungen"
    ARMATUREN = "armaturen"
    LUEFTUNGSAUSLAESSE = "lueftungsauslaesse"
    KANAELE = "kanaele"
    SANITAERARMATUREN = "sanitaerarmaturen"
    ELEKTROKOMPONENTEN = "elektrokomponenten"
    DAEMMUNG = "daemmung"
    BEFESTIGUNG = "befestigung"
    SONSTIGES = "sonstiges"

class SchnittstellenTypEnum(enum.Enum):
    """Typen von Schnittstellen zwischen Gewerken"""
    ELEKTROANSCHLUSS = "elektroanschluss"
    WASSERANSCHLUSS = "wasseranschluss"
    ABWASSERANSCHLUSS = "abwasseranschluss"
    LUEFTUNGSANSCHLUSS = "lueftungsanschluss"
    STEUERUNGSSIGNAL = "steuerungssignal"
    SCHLITZ_DURCHBRUCH = "schlitz_durchbruch"
    BEFESTIGUNG_TRAGWERK = "befestigung_tragwerk"


# Neue Models
class AusfuehrungsReifePruefung(Base):
    """
    Prüfung der Ausführungsreife eines Projekts
    """
    __tablename__ = "ausfuehrungs_reife_pruefungen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    status = Column(SQLEnum(AusfuehrungsStatusEnum), nullable=False)
    
    # Prüfergebnisse
    vollstaendigkeit_score = Column(Float, default=0.0)  # 0.0 - 1.0
    detailgrad_score = Column(Float, default=0.0)
    materialspezifikation_score = Column(Float, default=0.0)
    schnittstellen_score = Column(Float, default=0.0)
    gesamt_score = Column(Float, default=0.0)
    
    # Zusammenfassung
    anzahl_kritische_befunde = Column(Integer, default=0)
    anzahl_fehlende_dokumente = Column(Integer, default=0)
    anzahl_unklare_spezifikationen = Column(Integer, default=0)
    
    # Empfehlung
    empfehlung = Column(Text)
    naechste_schritte = Column(JSON)  # Liste von Aktionen
    
    # Zeitstempel
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    geprueft_von = Column(String)  # Agent-Name
    
    # Relationships
    projekt = relationship("Projekt")
    fehlende_dokumente = relationship("FehlendesDokument", back_populates="pruefung", cascade="all, delete-orphan")


class FehlendesDokument(Base):
    """
    Dokumentation von fehlenden oder unvollständigen Dokumenten
    """
    __tablename__ = "fehlende_dokumente"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pruefung_id = Column(String, ForeignKey("ausfuehrungs_reife_pruefungen.id"), nullable=False)
    
    dokument_typ = Column(String, nullable=False)  # "Grundriss", "Detail", "Schema", etc.
    gewerk = Column(String, nullable=False)
    beschreibung = Column(Text, nullable=False)
    prioritaet = Column(String, nullable=False)  # "hoch", "mittel", "niedrig"
    
    # Warum fehlt es?
    grund = Column(Text)  # "Nicht in Planliste", "Datei nicht gefunden", etc.
    
    # Relationships
    pruefung = relationship("AusfuehrungsReifePruefung", back_populates="fehlende_dokumente")


class MaterialListe(Base):
    """
    Automatisch generierte Materialliste für AVOR
    """
    __tablename__ = "material_listen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    gewerk = Column(String, nullable=False)
    
    # Metadaten
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    erstellt_von = Column(String)  # Agent-Name
    
    # Status
    validiert = Column(Boolean, default=False)
    validiert_von = Column(String)  # Benutzer-Name
    validiert_am = Column(DateTime)
    
    # Relationships
    projekt = relationship("Projekt")
    positionen = relationship("MaterialPosition", back_populates="liste", cascade="all, delete-orphan")


class MaterialPosition(Base):
    """
    Einzelne Position in einer Materialliste
    """
    __tablename__ = "material_positionen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    liste_id = Column(String, ForeignKey("material_listen.id"), nullable=False)
    
    # Material-Informationen
    kategorie = Column(SQLEnum(MaterialKategorieEnum), nullable=False)
    bezeichnung = Column(String, nullable=False)
    hersteller = Column(String)
    typ = Column(String)
    artikelnummer = Column(String)
    
    # Mengen
    menge = Column(Float, nullable=False)
    einheit = Column(String, nullable=False)  # "Stk", "m", "m²", "m³", etc.
    
    # Zusatzinformationen
    abmessungen = Column(String)  # z.B. "DN 50", "600x400"
    material = Column(String)  # z.B. "Kupfer", "Stahl", "Kunststoff"
    spezifikation = Column(Text)  # Detaillierte Spezifikation
    
    # Herkunft
    quelle_dokument_id = Column(String, ForeignKey("dokumente.id"))
    quelle_plan_referenz = Column(String)  # Plan-Nummer und Position
    extraktionsmethode = Column(String)  # "ocr", "manual", "llm", etc.
    konfidenz = Column(Float, default=0.0)  # 0.0 - 1.0
    
    # Preiskalkulation (optional)
    einheitspreis = Column(Float)
    gesamtpreis = Column(Float)
    
    # Relationships
    liste = relationship("MaterialListe", back_populates="positionen")
    quelle_dokument = relationship("Dokument")


class Schnittstelle(Base):
    """
    Schnittstellen zwischen Gewerken
    """
    __tablename__ = "schnittstellen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    
    # Beteiligte Gewerke
    gewerk_von = Column(String, nullable=False)  # z.B. "KG420_HEIZUNG"
    gewerk_zu = Column(String, nullable=False)   # z.B. "KG440_ELEKTRO"
    
    # Schnittstellen-Details
    typ = Column(SQLEnum(SchnittstellenTypEnum), nullable=False)
    beschreibung = Column(Text, nullable=False)
    position = Column(String)  # Raum, Geschoss, etc.
    
    # Status
    geklaert = Column(Boolean, default=False)
    verantwortlich = Column(String)  # Wer ist verantwortlich für Klärung?
    
    # Referenzen
    plan_referenz = Column(String)
    sud_plan_referenz = Column(String)  # Referenz zu SuD-Plan
    
    # Zeitstempel
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    geklaert_am = Column(DateTime)
    
    # Relationships
    projekt = relationship("Projekt")


class PlanRevision(Base):
    """
    Versionierung von Plänen für Änderungsmanagement
    """
    __tablename__ = "plan_revisionen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    dokument_id = Column(String, ForeignKey("dokumente.id"), nullable=False)
    
    # Revisions-Informationen
    revision_nummer = Column(String, nullable=False)  # z.B. "Rev. 02"
    revision_datum = Column(DateTime, nullable=False)
    aenderungsbeschreibung = Column(Text)
    
    # Datei
    file_path = Column(String, nullable=False)
    
    # Vergleich mit vorheriger Revision
    vorgaenger_id = Column(String, ForeignKey("plan_revisionen.id"))
    
    # Zeitstempel
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    projekt = relationship("Projekt")
    dokument = relationship("Dokument")
    vorgaenger = relationship("PlanRevision", remote_side=[id], backref="nachfolger")
    aenderungen = relationship("PlanAenderung", back_populates="revision", cascade="all, delete-orphan")


class PlanAenderung(Base):
    """
    Einzelne Änderung zwischen zwei Planrevisionen
    """
    __tablename__ = "plan_aenderungen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    revision_id = Column(String, ForeignKey("plan_revisionen.id"), nullable=False)
    
    # Änderungs-Details
    aenderungstyp = Column(String, nullable=False)  # "hinzugefuegt", "entfernt", "geaendert"
    kategorie = Column(String)  # "geometrie", "material", "spezifikation", etc.
    beschreibung = Column(Text, nullable=False)
    position = Column(String)  # Wo im Plan?
    
    # Betroffene Gewerke
    betroffene_gewerke = Column(JSON)  # Liste von Gewerken
    
    # Auswirkungen
    auswirkung_material = Column(Boolean, default=False)
    auswirkung_kosten = Column(Boolean, default=False)
    auswirkung_zeit = Column(Boolean, default=False)
    geschaetzte_mehrkosten = Column(Float)
    
    # Visualisierung
    diff_image_path = Column(String)  # Pfad zu Diff-Bild
    
    # Relationships
    revision = relationship("PlanRevision", back_populates="aenderungen")


class Nachtrag(Base):
    """
    Nachträge aufgrund von Planänderungen
    """
    __tablename__ = "nachtraege"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    projekt_id = Column(String, ForeignKey("projekte.id"), nullable=False)
    
    # Nachtrag-Informationen
    nummer = Column(String, nullable=False)  # z.B. "NT-001"
    titel = Column(String, nullable=False)
    beschreibung = Column(Text, nullable=False)
    
    # Ursache
    revision_von_id = Column(String, ForeignKey("plan_revisionen.id"))
    revision_zu_id = Column(String, ForeignKey("plan_revisionen.id"))
    
    # Betroffene Gewerke
    betroffene_gewerke = Column(JSON)
    
    # Kosten
    geschaetzte_mehrkosten = Column(Float, nullable=False)
    genehmigte_mehrkosten = Column(Float)
    
    # Status
    status = Column(String, default="entwurf")  # "entwurf", "eingereicht", "verhandlung", "genehmigt", "abgelehnt"
    eingereicht_am = Column(DateTime)
    genehmigt_am = Column(DateTime)
    
    # Zeitstempel
    erstellt_am = Column(DateTime, default=datetime.utcnow)
    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projekt = relationship("Projekt")
    revision_von = relationship("PlanRevision", foreign_keys=[revision_von_id])
    revision_zu = relationship("PlanRevision", foreign_keys=[revision_zu_id])

