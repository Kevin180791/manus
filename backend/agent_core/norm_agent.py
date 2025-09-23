
def run_norm_check(input_text: str) -> str:
    # Platzhalter für echte MetaGPT-Rollen
    if "Tiefgarage" in input_text and "6/h" in input_text:
        return (
            "Normprüfung abgeschlossen:\n"
            "- Normbezug: VDI 2053 (Lüftung von Garagen)\n"
            "- Geforderter Luftwechsel: >5/h\n"
            "- Geplanter Luftwechsel: 6/h => Konform\n"
            "Empfehlung: CO-Sensor prüfen und Wartung dokumentieren."
        )
    return "Keine relevanten Normvorgaben erkannt oder Text unvollständig."
