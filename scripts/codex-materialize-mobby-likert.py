import base64
import lzma
import subprocess
from pathlib import Path

BRANCH = "codex/add-mobby-mbti-diagnosis"
WORKFLOW = ".github/workflows/codex-materialize-mobby-likert.yml"
SCRIPT = "scripts/codex-materialize-mobby-likert.py"
PAYLOAD = "scripts/codex-materialize-mobby-likert.patch.lzma.b64"
PATCH = ".codex-mobby-likert.patch"


def run(*args):
    subprocess.run(args, check=True)


payload = Path(PAYLOAD).read_text().strip()
patch_bytes = lzma.decompress(base64.b64decode(payload))
Path(PATCH).write_bytes(patch_bytes)

run("git", "apply", "--binary", PATCH)
Path(PATCH).unlink(missing_ok=True)

run("git", "rm", "-f", WORKFLOW, SCRIPT, PAYLOAD)
run(
    "git",
    "add",
    "docs/api/line-ai/_diagnosis-knowledge.js",
    "docs/mobby/copy.js",
    "docs/mobby/index.html",
    "docs/mobby/logic.js",
    "docs/mobby/questions.js",
    "docs/package.json",
    "docs/scripts/validate-mobby-mbti-shadow.mjs",
)
run("git", "config", "user.name", "github-actions[bot]")
run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
staged = subprocess.run(["git", "diff", "--cached", "--quiet"])
if staged.returncode == 0:
    print("No staged changes after applying patch.")
else:
    run("git", "commit", "-m", "refine mobby mbti likert diagnosis")
    run("git", "push", "origin", f"HEAD:{BRANCH}")
