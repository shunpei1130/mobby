from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "mobby-touch" / "assets"
GENERATED = Path(r"C:\Users\User\.codex\generated_images\019f98ae-d5cd-7412-8eb5-fdff21d6720d")

SHEETS = {
    "mobichi": GENERATED / "exec-85d0c804-a267-4c67-b2d0-c213642f5ac5.png",
    "yami": GENERATED / "exec-789ddb3d-2394-4acb-b1dc-b9a4f2e910dd.png",
    "mobirin": GENERATED / "exec-c0e3fb4e-b9b3-492b-9d48-758c0b4cea6c.png",
}


def remove_green(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            dominance = g - max(r, b)
            if g > 80 and dominance >= 4:
                softness = min(1.0, max(0.0, dominance / 70.0))
                next_alpha = round(a * (1.0 - softness))
                if next_alpha < 24:
                    pixels[x, y] = (0, 0, 0, 0)
                else:
                    pixels[x, y] = (r, min(g, max(r, b) + 2), b, next_alpha)
    return image


def fit_on_frame(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return Image.new("RGBA", size, (0, 0, 0, 0))
    image = image.crop(bbox)
    max_width = size[0] - 18
    max_height = size[1] - 18
    scale = min(max_width / image.width, max_height / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", size, (0, 0, 0, 0))
    frame.alpha_composite(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    return frame


def export_sheet(character_id: str, sheet_path: Path) -> None:
    sheet = remove_green(Image.open(sheet_path))
    frame_size = (360, 240) if character_id == "yami" else (300, 270)
    outputs = []
    for index in range(9):
        row, column = divmod(index, 3)
        x0 = round(column * sheet.width / 3)
        x1 = round((column + 1) * sheet.width / 3)
        y0 = round(row * sheet.height / 3)
        y1 = round((row + 1) * sheet.height / 3)
        cell = sheet.crop((x0, y0, x1, y1))
        output = remove_green(fit_on_frame(cell, frame_size))
        output.save(ASSETS / f"{character_id}-eye-{index + 1}.webp", optimize=True)
        outputs.append(output)
    preview = Image.new("RGBA", (frame_size[0] * 3, frame_size[1] * 3), (239, 225, 201, 255))
    for index, output in enumerate(outputs):
        row, column = divmod(index, 3)
        preview.alpha_composite(output, (column * frame_size[0], row * frame_size[1]))
    preview.save(ROOT / ".codex-tmp" / "character-eyes" / f"{character_id}-processed-sheet.webp")


def main() -> None:
    for character_id, sheet_path in SHEETS.items():
        export_sheet(character_id, sheet_path)


if __name__ == "__main__":
    main()
