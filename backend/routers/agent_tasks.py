
from fastapi import APIRouter
from pydantic import BaseModel
from agent_core.norm_agent import run_norm_check

router = APIRouter()

class NormCheckRequest(BaseModel):
    input_text: str

@router.post("/normcheck")
def norm_check_task(request: NormCheckRequest):
    result = run_norm_check(request.input_text)
    return {"result": result}
