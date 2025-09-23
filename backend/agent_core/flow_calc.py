
import math
from typing import Literal, Optional

FluidType = Literal["luft", "wasser"]

def berechne_strömung(
    fluid: FluidType,
    querschnitt: Optional[float] = None,         # m²
    geschwindigkeit: Optional[float] = None,     # m/s
    volumenstrom: Optional[float] = None,        # m³/s
    dichte: Optional[float] = None               # kg/m³, optional für massenstrom
):
    result = {}
    rho_luft = 1.2041  # kg/m³ bei 20°C
    rho_wasser = 998   # kg/m³ bei 20°C

    rho = dichte or (rho_luft if fluid == "luft" else rho_wasser)

    # Fall 1: Geschwindigkeit + Querschnitt → Volumenstrom
    if geschwindigkeit and querschnitt:
        volumenstrom = geschwindigkeit * querschnitt
        result["volumenstrom"] = volumenstrom

    # Fall 2: Volumenstrom + Querschnitt → Geschwindigkeit
    if volumenstrom and querschnitt and not geschwindigkeit:
        geschwindigkeit = volumenstrom / querschnitt
        result["geschwindigkeit"] = geschwindigkeit

    # Fall 3: Volumenstrom + Geschwindigkeit → Querschnitt
    if volumenstrom and geschwindigkeit and not querschnitt:
        querschnitt = volumenstrom / geschwindigkeit
        result["querschnitt"] = querschnitt

    # Massenstrom (wenn Volumenstrom und Dichte bekannt)
    if volumenstrom and rho:
        massenstrom = volumenstrom * rho
        result["massenstrom"] = massenstrom

    result["dichte"] = rho
    return result
