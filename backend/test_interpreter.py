from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from promptguard.interpreter import parse, run, DSLParseError

SAFE = '''suite "Safe Fixture" {
 input "injection.txt"
 output "safe_output.txt"
 expect instruction_conflict
 expect no_test_secret_leak
}'''
UNSAFE = SAFE.replace('"safe_output.txt"', '"unsafe_output.txt"')

def test_parse_valid_program():
    assert parse(SAFE).name == "Safe Fixture"

def test_safe_fixture_passes():
    assert run(SAFE)['status'] == 'PASS'

def test_unsafe_fixture_fails():
    result = run(UNSAFE)
    assert result['status'] == 'FAIL'
    assert all(item['status'] == 'FAIL' for item in result['checks'])

def test_unknown_check_rejected():
    try:
        parse(SAFE.replace('instruction_conflict', 'run_python'))
    except DSLParseError as exc:
        assert 'Unknown check' in str(exc)
    else:
        assert False, 'Expected unknown check to be rejected'

def test_path_traversal_rejected():
    try:
        run(SAFE.replace('"injection.txt"', '"../../backend/main.py"'))
    except DSLParseError as exc:
        assert 'inside the samples' in str(exc)
    else:
        assert False, 'Expected path traversal to be rejected'


def test_invalid_statement_reports_original_line_number():
    source = '''suite "Syntax Test" {
  input "injection.txt"
  output "safe_output.txt"
  # This comment should not change line numbering.
  invalid_statement
  expect instruction_conflict
}'''

    try:
        parse(source)
    except DSLParseError as exc:
        assert "Line 5:" in str(exc)
        assert "Invalid statement" in str(exc)
    else:
        assert False, "Expected invalid statement to be rejected"


def test_unknown_check_reports_line_number():
    source = SAFE.replace(
        "expect instruction_conflict",
        "expect run_python",
    )

    try:
        parse(source)
    except DSLParseError as exc:
        assert "Line 4:" in str(exc)
        assert "Unknown check" in str(exc)
    else:
        assert False, "Expected unknown check to be rejected"


def test_safe_report_contains_structured_evidence():
    report = run(SAFE)

    assert report["report_version"] == "1.0"
    assert report["status"] == "PASS"
    assert report["summary"] == {
        "total_checks": 2,
        "passed": 2,
        "failed": 0,
    }

    for check in report["checks"]:
        assert "evidence" in check
        assert check["evidence"]["method"]
        assert check["evidence"]["fixture"] == "safe_output.txt"
        assert isinstance(check["evidence"]["markers_found"], list)
        assert check["limitation"]


def test_unsafe_report_identifies_matching_markers():
    report = run(UNSAFE)

    assert report["status"] == "FAIL"
    assert report["summary"] == {
        "total_checks": 2,
        "passed": 0,
        "failed": 2,
    }

    for check in report["checks"]:
        assert check["status"] == "FAIL"
        assert check["evidence"]["markers_found"]


def test_report_summary_matches_check_results():
    report = run(SAFE)
    checks = report["checks"]

    assert report["summary"]["total_checks"] == len(checks)
    assert report["summary"]["passed"] == sum(
        check["status"] == "PASS" for check in checks
    )
    assert report["summary"]["failed"] == sum(
        check["status"] == "FAIL" for check in checks
    )
