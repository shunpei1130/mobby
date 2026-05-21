"""
Convert all 32 images from 1:1 (1024x1024) to 9:16 aspect ratio
by extending the background vertically (top and bottom).

Strategy:
- Target ratio: 9:16 → width=1024, height=1024*(16/9) ≈ 1820
  Rounding to 1820 to keep integers.
- Extra height needed: 1820 - 1024 = 796 pixels
- Add 398 pixels on top and 398 on bottom
- Fill extension by reflecting + blurring edge strips for natural look
"""

import os
from PIL import Image, ImageFilter
import numpy as np

SRC_DIR = "."
DST_DIR = "./916"
TARGET_RATIO = 16 / 9  # height / width

def extend_image_916(img_path, dst_path):
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    
    # Calculate new height for 9:16 (width:height)
    new_h = round(w * TARGET_RATIO)
    extra = new_h - h
    top_pad = extra // 2
    bot_pad = extra - top_pad
    
    # Create new canvas
    canvas = Image.new("RGB", (w, new_h))
    
    # Place original image in center
    canvas.paste(img, (0, top_pad))
    
    # --- Fill top extension ---
    # Take top strip of original, flip vertically, blur heavily
    strip_h = min(top_pad, h // 2)
    top_strip = img.crop((0, 0, w, strip_h))
    top_strip = top_strip.transpose(Image.FLIP_TOP_BOTTOM)
    
    # Resize strip to fill entire top_pad area
    top_fill = top_strip.resize((w, top_pad), Image.LANCZOS)
    # Apply heavy Gaussian blur for smooth background
    top_fill = top_fill.filter(ImageFilter.GaussianBlur(radius=40))
    
    # Blend: make the edge rows match by sampling edge color
    top_edge_row = img.crop((0, 0, w, 1))
    top_edge_color = np.array(top_edge_row).mean(axis=1).mean(axis=0).astype(np.uint8)
    
    # Create gradient overlay from solid color at top to transparent near image
    top_arr = np.array(top_fill)
    for y in range(top_pad):
        # alpha goes from 1.0 (top) to 0.0 (near image)
        alpha = 1.0 - (y / top_pad)
        alpha = alpha ** 0.5  # ease curve - more color at top
        top_arr[y] = (top_arr[y].astype(float) * (1 - alpha * 0.4) + 
                      top_edge_color.astype(float) * alpha * 0.4).astype(np.uint8)
    
    top_fill = Image.fromarray(top_arr)
    canvas.paste(top_fill, (0, 0))
    
    # --- Fill bottom extension ---
    strip_h = min(bot_pad, h // 2)
    bot_strip = img.crop((0, h - strip_h, w, h))
    bot_strip = bot_strip.transpose(Image.FLIP_TOP_BOTTOM)
    
    bot_fill = bot_strip.resize((w, bot_pad), Image.LANCZOS)
    bot_fill = bot_fill.filter(ImageFilter.GaussianBlur(radius=40))
    
    bot_edge_row = img.crop((0, h - 1, w, h))
    bot_edge_color = np.array(bot_edge_row).mean(axis=1).mean(axis=0).astype(np.uint8)
    
    bot_arr = np.array(bot_fill)
    for y in range(bot_pad):
        alpha = y / bot_pad
        alpha = alpha ** 0.5
        bot_arr[y] = (bot_arr[y].astype(float) * (1 - alpha * 0.4) + 
                      bot_edge_color.astype(float) * alpha * 0.4).astype(np.uint8)
    
    bot_fill = Image.fromarray(bot_arr)
    canvas.paste(bot_fill, (0, top_pad + h))
    
    # Save
    canvas.save(dst_path, "JPEG", quality=95)
    print(f"  Saved: {dst_path} ({w}x{new_h})")

def main():
    os.makedirs(DST_DIR, exist_ok=True)
    
    images = sorted([f for f in os.listdir(SRC_DIR) 
                     if f.lower().endswith(('.jpg', '.jpeg', '.webp')) 
                     and f != 'extend_to_916.py'])
    
    print(f"Found {len(images)} images to process")
    
    for i, fname in enumerate(images, 1):
        src = os.path.join(SRC_DIR, fname)
        dst = os.path.join(DST_DIR, fname)
        print(f"[{i}/{len(images)}] Processing {fname}...")
        extend_image_916(src, dst)
    
    print(f"\nDone! All images saved to {DST_DIR}/")

if __name__ == "__main__":
    main()
