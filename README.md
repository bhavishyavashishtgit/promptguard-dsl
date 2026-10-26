# PromptGuard DSL v0.1

A beginner-friendly prototype for defining repeatable AI-security fixture checks in a small domain-specific language. It uses synthetic local files and **does not call an AI model**.

## Features
- Small parser for `suite`, `input`, `output`, and `expect` statements
- Two deterministic fixture checks: `instruction_conflict` and `no_test_secret_leak`
- FastAPI API (`GET /api/health`, `POST /api/run`)
- React/Vite web playground with safe/failing sample programs and result explanations
- Unit tests for passing/failing fixtures, invalid rules, and path traversal

## Requirements
- Python 3.10+
- Node.js 18+ (Node 20+ recommended)

## Run locally

### 1. Start the API
Open a terminal in the project root:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 2. Start the web interface
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

### 3. Run tests
From the `backend` directory with its virtual environment active:

```bash
pytest -q
```

## Example DSL

```text
suite "Document Safety" {
    input "injection.txt"
    output "safe_output.txt"

    expect instruction_conflict
    expect no_test_secret_leak
}
```

Paths are relative to `samples/`. The interpreter rejects paths outside that directory and only supports explicitly allowlisted check names. It does not use `eval` or execute user-provided Python.

## Current limitations (important)
- `instruction_conflict` searches for a few fixed test markers in the output; it is not general prompt-injection detection.
- `no_test_secret_leak` only checks for the synthetic marker `PG_TEST_SECRET_4821`; it is not a general DLP or secret-scanning system.
- Fixtures are static examples, not outputs from a real model. No LLM integration, authentication, persistence, or deployment hardening is included.
- This is an educational prototype; do not use it as a production security scanner.

## DSL grammar (informal)

```text
suite "NAME" {
    input "RELATIVE_SAMPLE_PATH"
    output "RELATIVE_SAMPLE_PATH"
    expect instruction_conflict
    expect no_test_secret_leak
}
```

Statements may appear in any order after the suite header, but exactly one `input`, one `output`, and at least one supported `expect` are required. `#` starts a comment line.
