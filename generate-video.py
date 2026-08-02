#!/usr/bin/env python3
"""
Text prompt → Realistic image → Realistic video
Single command: python generate-video.py "your prompt here"
"""
import sys
import torch
from diffusers import StableVideoDiffusionPipeline, DiffusionPipeline
from PIL import Image
import os

# Output folder
OUT = "generated_videos"
os.makedirs(OUT, exist_ok=True)

def generate_image(prompt: str, seed: int = 42) -> Image.Image:
    """Text → realistic image using SDXL."""
    print(f"📸 Generating image from: {prompt}")

    # Use SDXL for photorealism
    pipe = DiffusionPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        use_safetensors=True,
        variant="fp16"
    )

    # Optimize for weak GPU
    pipe.enable_attention_slicing()
    pipe.enable_model_cpu_offload()  # offload to CPU between steps

    device = "cuda" if torch.cuda.is_available() else "cpu"
    pipe = pipe.to(device)

    # Generate
    image = pipe(
        prompt=prompt,
        num_inference_steps=30,
        guidance_scale=7.5,
        height=576,
        width=1024,
        generator=torch.Generator(device=device).manual_seed(seed)
    ).images[0]

    # Save intermediate
    img_path = f"{OUT}/frame.jpg"
    image.save(img_path)
    print(f"✓ Image saved: {img_path}")
    return image


def generate_video(image: Image.Image, output_name: str = "output"):
    """Image → realistic video using Stable Video Diffusion."""
    print(f"🎬 Generating video from image...")

    pipe = StableVideoDiffusionPipeline.from_pretrained(
        "stabilityai/stable-video-diffusion-img2vid-xt",
        torch_dtype=torch.float16,
        variant="fp16"
    )

    # Optimize for weak GPU
    pipe.enable_attention_slicing()
    pipe.enable_model_cpu_offload()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    pipe = pipe.to(device)

    # Generate 25 frames (5 seconds at 5fps)
    frames = pipe(
        image,
        height=576,
        width=1024,
        num_frames=25,
        num_inference_steps=25,
        decode_chunk_size=2,  # lower for weak VRAM
        generator=torch.Generator(device=device).manual_seed(0)
    ).frames[0]  # returns list of [list of PIL Images]

    # Save as MP4
    import imageio
    video_path = f"{OUT}/{output_name}.mp4"
    imageio.mimsave(video_path, frames, fps=5)
    print(f"✓ Video saved: {video_path}")
    return video_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate-video.py \"your prompt here\"")
        print("Example: python generate-video.py \"elegant handblock saree, red and black pattern, studio lighting\"")
        sys.exit(1)

    prompt = " ".join(sys.argv[1:])

    # Step 1: Generate image
    image = generate_image(prompt)

    # Step 2: Generate video
    generate_video(image, output_name="video")

    print("\n✅ Done! Video in generated_videos/")
