
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal
from agent_core.flow_calc import berechne_strömung

router = APIRouter()

class FlowRequest(BaseModel):
    fluid: Literal["luft", "wasser"]
    querschnitt: Optional[float] = None
    geschwindigkeit: Optional[float] = None
    volumenstrom: Optional[float] = None
    dichte: Optional[float] = None

@router.post("/flowcalc")
def flowcalc_task(req: FlowRequest):
    result = berechne_strömung(
        fluid=req.fluid,
        querschnitt=req.querschnitt,
        geschwindigkeit=req.geschwindigkeit,
        volumenstrom=req.volumenstrom,
        dichte=req.dichte
    )
    return result
