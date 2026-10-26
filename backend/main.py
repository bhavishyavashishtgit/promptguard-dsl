from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from promptguard.interpreter import run, DSLParseError

app = FastAPI(
    title="PromptGuard DSL API",
    version="0.2.0",
    description=(
        "An educational DSL interpreter for reproducible "
        "AI-security fixture tests."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class RunRequest(BaseModel):
    source: str = Field(max_length=10000)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "project": "PromptGuard DSL",
        "version": "0.2.0",
    }


@app.post("/api/run")
def run_program(request: RunRequest):
    try:
        return run(request.source)

    except DSLParseError as exc:
        return {
            "report_version": "1.0",
            "status": "ERROR",
            "error": str(exc),
            "summary": {
                "total_checks": 0,
                "passed": 0,
                "failed": 0,
            },
            "checks": [],
            "notice": "The program could not be evaluated.",
        }

    except (OSError, UnicodeError):
        return {
            "report_version": "1.0",
            "status": "ERROR",
            "error": "Could not read the requested sample fixture.",
            "summary": {
                "total_checks": 0,
                "passed": 0,
                "failed": 0,
            },
            "checks": [],
            "notice": "The program could not be evaluated.",
        }
