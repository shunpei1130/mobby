from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "docs" / "mobby-touch"
OUTPUT_DIR = ROOT / ".codex-tmp" / "character-eyes"

CHARACTERS = {
    "mobichi": {
        "source": "mobby-gal.webp",
        "edit_crop": (150, 120, 570, 540),
        "eye_crop": (245, 215, 480, 450),
    },
    "yami": {
        "source": "mobby-yami.webp",
        "edit_crop": (120, 170, 520, 570),
        "eye_crop": (195, 275, 455, 465),
    },
    "mobirin": {
        "source": "mobby-fact-man.webp",
        "edit_crop": (150, 130, 570, 550),
        "eye_crop": (250, 215, 485, 455),
    },
}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    previews = []
    for character_id, config in CHARACTERS.items():
        source = Image.open(SOURCE_DIR / config["source"]).convert("RGBA")
        edit_reference = source.crop(config["edit_crop"])
        eye_reference = source.crop(config["eye_crop"])
        edit_reference.save(OUTPUT_DIR / f"{character_id}-eye-removal-reference.png")
        eye_reference.save(OUTPUT_DIR / f"{character_id}-eye-style-reference.png")
        previews.append((edit_reference, eye_reference))

    sheet = Image.new("RGBA", (840, 1260), (239, 225, 201, 255))
    for row, (edit_reference, eye_reference) in enumerate(previews):
        sheet.alpha_composite(edit_reference, (0, row * 420))
        eye_preview = eye_reference.copy()
        eye_preview.thumbnail((400, 400), Image.Resampling.LANCZOS)
        sheet.alpha_composite(eye_preview, (430, row * 420 + (400 - eye_preview.height) // 2))
    sheet.save(OUTPUT_DIR / "_references-sheet.png")


if __name__ == "__main__":
    main()
