
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent_tasks, upload_router, flowcalc_tasks, tga_router

app = FastAPI(
    title="OpenManus TGA-KI-Plattform", 
    version="2.0",
    description="KI-gestützte Plattform für automatische TGA-Planprüfung"
)

# CORS Middleware hinzufügen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In Produktion spezifische Origins angeben
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routen registrieren
app.include_router(agent_tasks.router, prefix="/agent/tasks", tags=["Legacy Agents"])
app.include_router(upload_router.router, prefix="/documents", tags=["Legacy Upload"])
app.include_router(flowcalc_tasks.router, prefix="/agent/tasks", tags=["Legacy Flow Calc"])
app.include_router(tga_router.router, prefix="/api/v1/tga", tags=["TGA Planprüfung"])

@app.get("/", tags=["System"])
def root():
    return {
        "message": "OpenManus TGA-KI-Plattform Backend läuft",
        "version": "2.0",
        "features": [
            "Automatische TGA-Planprüfung",
            "Multi-Agent-Workflow",
            "Gewerkespezifische Fachprüfung",
            "Koordinationsprüfung",
            "Normkonformitätsprüfung"
        ]
    }

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "tga-ki-plattform"}
