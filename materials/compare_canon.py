"""compare_canon.py - the Python reference and the browser engine must agree by VALUE.

    python3 materials/compare_canon.py            # PASS or the first mismatch
    python3 materials/compare_canon.py --selftest # plants a one-second fault and must FAIL

Runs materials/fb-node.js (the real fb-live.js engine under node) and fb_reference.canon().
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fb_reference import canon  # noqa: E402


def norm(x):
    return json.loads(json.dumps(x, sort_keys=True))


def diff(a, b, path="$"):
    if type(a) != type(b):
        return "%s: type %s vs %s" % (path, type(a).__name__, type(b).__name__)
    if isinstance(a, dict):
        if set(a) != set(b):
            return "%s: keys %s" % (path, sorted(set(a) ^ set(b)))
        for k in a:
            d = diff(a[k], b[k], path + "." + k)
            if d:
                return d
        return None
    if isinstance(a, list):
        if len(a) != len(b):
            return "%s: length %d vs %d" % (path, len(a), len(b))
        for i, (x, y) in enumerate(zip(a, b)):
            d = diff(x, y, "%s[%d]" % (path, i))
            if d:
                return d
        return None
    return None if a == b else "%s: %r vs %r" % (path, a, b)


def main():
    js = json.loads(subprocess.check_output(["node", os.path.join(HERE, "fb-node.js")]))
    py = norm(canon())
    if "--selftest" in sys.argv:
        py[2]["runs"][1]["totalSec"] += 1
    d = diff(py, norm(js))
    n = sum(len(r["runs"]) for r in py)
    if d:
        print("FAIL", d)
        sys.exit(1)
    print("PASS: %d rungs x %d breath clocks, every value equal" % (len(py), n // len(py)))


if __name__ == "__main__":
    main()
