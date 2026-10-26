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
