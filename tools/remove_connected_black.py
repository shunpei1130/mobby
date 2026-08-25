"""Remove only the black background connected to the image border.

The supplied character renders contain very dark fur and hardware. A regular
black chroma key treats those pixels as background too, so this uses a flood
fill from the border and keeps dark pixels enclosed by the character opaque.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def remove_background(source: Path, target: Path, threshold: int = 28) -> None:
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    threshold_sq = threshold * threshold

    def background_like(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        return r * r + g * g + b * b <= threshold_sq

    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or not background_like(x, y):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                index = ny * width + nx
                if not visited[index] and background_like(nx, ny):
                    visited[index] = 1
                    queue.append((nx, ny))

    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if visited[y * width + x]:
                alpha_pixels[x, y] = 0

    # Keep a narrow anti-aliased edge without fading the dark fur inside.
    softened = alpha.filter(ImageFilter.GaussianBlur(0.65))
    image.putalpha(softened)
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--threshold", type=int, default=28)
    args = parser.parse_args()
    remove_background(args.source, args.target, args.threshold)


if __name__ == "__main__":
    main()
