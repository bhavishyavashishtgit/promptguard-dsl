# PromptGuard DSL

**A lightweight domain-specific language for reproducible AI-security fixture testing.**

PromptGuard DSL is an educational prototype that lets developers define simple security checks in a readable, structured format and run them through a web playground. It produces structured JSON reports containing test results, evidence, and limitations.

## Why PromptGuard DSL?

AI-security testing can be difficult to document consistently. PromptGuard DSL explores a simple approach: express test expectations in a small language, run them against local test fixtures, and generate evidence that is easier to review and reproduce.

## Features

- **Custom DSL:** Write test suites using readable instructions such as `input`, `output`, and `expect`.
- **Web playground:** Run test suites through a React-based interface.
- **Python API:** Execute suites through a FastAPI backend.
- **Structured reports:** View pass/fail results, check summaries, evidence, and limitations.
- **JSON export:** Download a test report for documentation and review.
- **Safe test fixtures:** Demonstrate instruction-conflict and test-marker checks using synthetic examples.
- **Transparent limitations:** Reports explain that results apply only to the configured fixtures and implemented checks.

## Tech Stack

- Python
- FastAPI
- React
- Vite
- JavaScript
- Pytest

## Example DSL

```text
suite "Document Safety" {
    input "injection.txt"
    output "safe_output.txt"

    expect instruction_conflict
    expect no_test_secret_leak
}
```

## How It Works

1. Write a test suite using the PromptGuard DSL syntax.
2. The backend parses the suite and evaluates its configured checks against the test fixtures.
3. The interpreter produces a structured result.
4. The playground displays the status and evidence.
5. Export the report as JSON for further review.

## Run Locally

### 1. Start the backend

Activate your Python virtual environment, then run:

```powershell
cd backend
python -m uvicorn main:app --reload
```

The API should be available at `http://127.0.0.1:8000`.

Interactive API documentation: `http://127.0.0.1:8000/docs`

### 2. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

> Run these commands from the correct project folders. If your setup uses different entry points or scripts, update this section to match your working configuration.

## Testing

Run the backend tests from the backend directory with your virtual environment activated:

```powershell
python -m pytest -v
```

## Scope and Limitations

PromptGuard DSL is an educational, fixture-based prototype. Its results describe only the configured test fixtures and implemented checks. A passing result does **not** prove that an AI model, application, or deployment is secure, and this project does not replace comprehensive security testing.

## Project Status

The core prototype includes a DSL interpreter, a FastAPI endpoint, a web playground, and structured test reports. Further work can focus on broader test coverage, improved diagnostics, documentation, and deployment.

## Author

**Bhavishya**

Built as a project exploring readable security testing, reproducible evidence, and AI-security concepts.
