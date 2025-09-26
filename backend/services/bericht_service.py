"""
Service für PDF-Berichtsgenerierung
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path
import logging

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

from models import PruefAuftrag

logger = logging.getLogger(__name__)

class BerichtService:
    """Service für die Generierung von TGA-Prüfberichten"""
    
    def __init__(self, db: Session):
        self.db = db
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
    
    def generiere_pruefbericht(self, auftrag_id: str) -> Optional[str]:
        """
        Generiert einen PDF-Prüfbericht für einen Auftrag
        """
        try:
            # Hole Auftrag mit allen Daten
            auftrag = self.db.query(PruefAuftrag).filter(
                PruefAuftrag.id == auftrag_id
            ).first()
            
            if not auftrag:
                logger.error(f"Auftrag {auftrag_id} nicht gefunden")
                return None
            
            # Erstelle PDF-Datei
            filename = f"pruefbericht_{auftrag_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = self.reports_dir / filename
            
            # Generiere PDF
            self._create_pdf_report(auftrag, str(filepath))
            
            logger.info(f"Prüfbericht erstellt: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Fehler bei Berichtsgenerierung: {e}")
            return None
    
    def _create_pdf_report(self, auftrag: PruefAuftrag, filepath: str):
        """Erstellt das PDF-Dokument"""
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Story (Inhalt)
        story = []
        
        # Titel
        story.append(Paragraph("TGA-Planprüfbericht", title_style))
        story.append(Spacer(1, 20))
        
        # Projektinformationen
        story.append(Paragraph("Projektinformationen", heading_style))
        
        projekt_data = [
            ['Projekt:', auftrag.projekt.name],
            ['Projekttyp:', auftrag.projekt.typ.value],
            ['Leistungsphase:', auftrag.projekt.leistungsphase.value],
            ['Prüfdatum:', auftrag.erstellt_am.strftime('%d.%m.%Y %H:%M')],
            ['Auftrag-ID:', auftrag.id]
        ]
        
        projekt_table = Table(projekt_data, colWidths=[4*cm, 10*cm])
        projekt_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(projekt_table)
        story.append(Spacer(1, 20))
        
        # Prüfstatistiken
        story.append(Paragraph("Prüfstatistiken", heading_style))
        
        # Befunde nach Priorität zählen
        befunde_stats = {"hoch": 0, "mittel": 0, "niedrig": 0}
        gewerk_stats = {}
        kategorie_stats = {}
        
        for befund in auftrag.befunde:
            befunde_stats[befund.prioritaet.value] += 1
            
            gewerk = befund.gewerk.value
            gewerk_stats[gewerk] = gewerk_stats.get(gewerk, 0) + 1
            
            kategorie = befund.kategorie.value
            kategorie_stats[kategorie] = kategorie_stats.get(kategorie, 0) + 1
        
        stats_data = [
            ['Anzahl Dokumente:', str(auftrag.anzahl_dokumente)],
            ['Anzahl Befunde gesamt:', str(auftrag.anzahl_befunde)],
            ['Befunde hohe Priorität:', str(befunde_stats['hoch'])],
            ['Befunde mittlere Priorität:', str(befunde_stats['mittel'])],
            ['Befunde niedrige Priorität:', str(befunde_stats['niedrig'])]
        ]
        
        stats_table = Table(stats_data, colWidths=[6*cm, 4*cm])
        stats_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(stats_table)
        story.append(Spacer(1, 20))
        
        # Befunde nach Priorität
        for prioritaet in ['hoch', 'mittel', 'niedrig']:
            prioritaet_befunde = [b for b in auftrag.befunde if b.prioritaet.value == prioritaet]
            
            if prioritaet_befunde:
                story.append(Paragraph(f"Befunde - Priorität {prioritaet.upper()}", heading_style))
                
                for i, befund in enumerate(prioritaet_befunde, 1):
                    story.append(self._create_befund_section(befund, i, styles))
                    story.append(Spacer(1, 15))
        
        # Zusammenfassung
        story.append(PageBreak())
        story.append(Paragraph("Zusammenfassung und Empfehlungen", heading_style))
        
        zusammenfassung = self._create_zusammenfassung(auftrag, befunde_stats, gewerk_stats)
        story.append(Paragraph(zusammenfassung, styles['Normal']))
        
        # Generiere PDF
        doc.build(story)
    
    def _create_befund_section(self, befund, nummer: int, styles) -> Table:
        """Erstellt eine Sektion für einen Befund"""
        
        # Prioritäts-Farbe
        priority_colors = {
            'hoch': colors.red,
            'mittel': colors.orange,
            'niedrig': colors.yellow
        }
        
        priority_color = priority_colors.get(befund.prioritaet.value, colors.grey)
        
        # Befund-Daten
        befund_data = [
            [f"Befund {nummer}", ""],
            ["Titel:", befund.titel],
            ["Gewerk:", befund.gewerk.value.upper()],
            ["Kategorie:", befund.kategorie.value.capitalize()],
            ["Priorität:", befund.prioritaet.value.upper()],
            ["Beschreibung:", befund.beschreibung],
        ]
        
        if befund.norm_referenz:
            befund_data.append(["Norm-Referenz:", befund.norm_referenz])
        
        if befund.plan_referenz:
            befund_data.append(["Plan-Referenz:", befund.plan_referenz])
        
        if befund.empfehlung:
            befund_data.append(["Empfehlung:", befund.empfehlung])
        
        befund_data.append(["Konfidenz:", f"{befund.konfidenz_score:.1%}"])
        
        # Tabelle erstellen
        befund_table = Table(befund_data, colWidths=[3*cm, 11*cm])
        befund_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (1, 0), priority_color),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 11),
        ]))
        
        return befund_table
    
    def _create_zusammenfassung(self, auftrag: PruefAuftrag, befunde_stats: Dict, gewerk_stats: Dict) -> str:
        """Erstellt eine Zusammenfassung des Prüfberichts"""
        
        zusammenfassung = f"""
        Die automatische TGA-Planprüfung für das Projekt "{auftrag.projekt.name}" wurde erfolgreich durchgeführt.
        
        <b>Prüfumfang:</b><br/>
        Es wurden {auftrag.anzahl_dokumente} Dokumente analysiert und {auftrag.anzahl_befunde} Befunde identifiziert.
        
        <b>Befundverteilung:</b><br/>
        • Hohe Priorität: {befunde_stats['hoch']} Befunde<br/>
        • Mittlere Priorität: {befunde_stats['mittel']} Befunde<br/>
        • Niedrige Priorität: {befunde_stats['niedrig']} Befunde<br/>
        
        <b>Betroffene Gewerke:</b><br/>
        """
        
        for gewerk, anzahl in gewerk_stats.items():
            gewerk_name = gewerk.replace('kg', 'KG').replace('_', ' ').upper()
            zusammenfassung += f"• {gewerk_name}: {anzahl} Befunde<br/>"
        
        # Empfehlungen basierend auf Befunden
        if befunde_stats['hoch'] > 0:
            zusammenfassung += """
            <b>Dringende Handlungsempfehlungen:</b><br/>
            Es wurden Befunde mit hoher Priorität identifiziert, die umgehend bearbeitet werden sollten.
            Diese betreffen kritische Aspekte der TGA-Planung und können Auswirkungen auf die
            Funktionssicherheit oder Normkonformität haben.
            """
        
        if befunde_stats['mittel'] > 0:
            zusammenfassung += """
            <b>Mittelfristige Optimierungen:</b><br/>
            Die identifizierten Befunde mittlerer Priorität sollten in der weiteren Planungsphase
            berücksichtigt und bearbeitet werden.
            """
        
        zusammenfassung += f"""
        <b>Prüfmethodik:</b><br/>
        Die Prüfung erfolgte automatisiert durch ein Multi-Agent-System mit spezialisierten
        Fachprüfern für die verschiedenen TGA-Gewerke. Die Analyse basiert auf aktuellen
        Normen und Richtlinien sowie gebäudetypspezifischen Anforderungen.
        
        <b>Nächste Schritte:</b><br/>
        1. Bearbeitung der Befunde hoher Priorität<br/>
        2. Überprüfung und Anpassung der Planungsunterlagen<br/>
        3. Koordination zwischen den betroffenen Gewerken<br/>
        4. Erneute Prüfung nach Planungsanpassungen<br/>
        
        Erstellt am: {datetime.now().strftime('%d.%m.%Y um %H:%M Uhr')}<br/>
        System: OpenManus TGA-KI-Plattform v2.0
        """
        
        return zusammenfassung
    
    def hole_bericht_pfad(self, auftrag_id: str) -> Optional[str]:
        """
        Sucht nach einem existierenden Bericht für einen Auftrag
        """
        # Suche nach Dateien mit dem Auftrag-ID-Pattern
        pattern = f"pruefbericht_{auftrag_id}_*.pdf"
        
        for file_path in self.reports_dir.glob(pattern):
            if file_path.exists():
                return str(file_path)
        
        return None
    
    def loesche_bericht(self, auftrag_id: str) -> bool:
        """
        Löscht einen Bericht für einen Auftrag
        """
        bericht_pfad = self.hole_bericht_pfad(auftrag_id)
        
        if bericht_pfad:
            try:
                Path(bericht_pfad).unlink()
                logger.info(f"Bericht gelöscht: {bericht_pfad}")
                return True
            except Exception as e:
                logger.error(f"Fehler beim Löschen des Berichts: {e}")
        
        return False

