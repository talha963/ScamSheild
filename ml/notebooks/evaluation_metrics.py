"""
ScamShield Live - Benchmark & Model Evaluation Engine (PDF Section 8.2)

This entry point used to print hard-coded numbers. It now runs the real, measured evaluation
suite in ml/evaluation/ (speech -> extraction -> risk fusion -> metrics) and prints the results.

    python ml/notebooks/evaluation_metrics.py              # full run
    python ml/notebooks/evaluation_metrics.py --quick      # fast sample
    python ml/notebooks/evaluation_metrics.py --regenerate # rebuild the synthetic corpus first

Full documentation: ml/evaluation/README.md
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.evaluation.run_evaluation import print_console, run_all  # noqa: E402


def run_evaluation_benchmark(quick: bool = False, regenerate: bool = False):
    report = run_all(regenerate=regenerate, quick=quick,
                     progress=lambda k, n: print(f"  ... {k}/{n} calls", flush=True))
    print_console(report)
    return report


if __name__ == "__main__":
    run_evaluation_benchmark(quick="--quick" in sys.argv, regenerate="--regenerate" in sys.argv)
