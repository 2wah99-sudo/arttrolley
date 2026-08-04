#!/usr/bin/env python3
"""
Replicate pipeline client for scroll-site-generator.

Usage:
  python3 hf.py image '<json>'    # {"name": str, "prompt": str, "model": str?, "out": path?}
  python3 hf.py upload <file>
  python3 hf.py video '<json>'    # {"name": str, "image_url": str, "prompt": str,
                                  #  "negative_prompt": str?, "duration": int?, "model": str?,
                                  #  "end_image_url": str?, "out": path?}

Reads REPLICATE_API_TOKEN from env or from .env next to the project root.
"""

import sys
import os
import json
import time
import requests

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Replicate API
REPLICATE_API_URL = "https://api.replicate.com/v1"
IMAGE_MODELS = {"flux-pro", "flux-schnell", "sdxl", "sd3.5"}
VIDEO_MODELS = {"kling", "kling-pro"}


def get_replicate_token():
    token = os.environ.get("REPLICATE_API_TOKEN", "")
    if not token:
        env_path = os.path.join(PROJECT, ".env")
        if os.path.exists(env_path):
            for line in open(env_path):
                if line.startswith("REPLICATE_API_TOKEN="):
                    token = line.split("=", 1)[1].strip().strip("'\"")
    if not token:
        print("ERROR: REPLICATE_API_TOKEN not found (env or .env)")
        sys.exit(1)
    return token


def auth_headers():
    token = get_replicate_token()
    return {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }


def download(url, out_path):
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(r.content)
    print(f"saved: {out_path}")


def poll_prediction(prediction_id, timeout=900, interval=5, kind="image"):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{REPLICATE_API_URL}/predictions/{prediction_id}", headers=auth_headers(), timeout=15)
            if r.ok:
                data = r.json()
                status = data.get("status", "")
                if status == "succeeded":
                    output = data.get("output", [])
                    if output:
                        return output[0] if isinstance(output, list) else output
                    return None
                if status in ("failed", "canceled"):
                    error = data.get("error", "unknown error")
                    print(f"  {status}: {error}")
                    return None
                print(f"  [{kind}] {status} ({int(time.time() - start)}s)...")
        except requests.RequestException as e:
            print(f"  [{kind}] network error: {e}")
        time.sleep(interval)
    print(f"  [{kind}] timed out after {timeout}s")
    return None


def gen_image(spec):
    model = spec.get("model", "black-forest-labs/flux-pro")
    prompt = spec["prompt"]
    print(f"[image] {spec['name']} → {model}")

    # Map model names
    model_map = {
        "flux-pro": "black-forest-labs/flux-pro",
        "flux": "black-forest-labs/flux-pro",
        "flux-schnell": "black-forest-labs/flux-schnell",
        "sdxl": "stability-ai/sdxl",
        "sd3.5": "stability-ai/sd3.5-large",
    }
    model = model_map.get(model, model)

    payload = {
        "input": {
            "prompt": prompt,
            "aspect_ratio": spec.get("aspect_ratio", "16:9"),
        }
    }

    resp = requests.post(f"{REPLICATE_API_URL}/predictions", headers=auth_headers(), json=payload, timeout=30)
    print(f"[image] submit → {resp.status_code}")
    if not resp.ok:
        print(f"FAILED: {resp.text[:300]}")
        return None

    data = resp.json()
    prediction_id = data.get("id")
    if not prediction_id:
        print(f"no prediction_id: {data}")
        return None

    print(f"[image] queued: {prediction_id}")
    url = poll_prediction(prediction_id, kind="image")
    if url:
        out = spec.get("out") or os.path.join(PROJECT, "assets", f"{spec['name']}.png")
        download(url, out)
        print(f"URL: {url}")
    return url


def upload_image(file_path):
    print(f"[upload] {file_path}")
    with open(file_path, 'rb') as f:
        files = {'file': f}
        resp = requests.post(f"{REPLICATE_API_URL}/files", headers={"Authorization": f"Token {get_replicate_token()}"}, files=files, timeout=30)
    if resp.ok:
        data = resp.json()
        url = data.get('urls', {}).get('get')
        print(f"UPLOADED: {url}")
        return url
    print(f"UPLOAD FAILED: {resp.text}")
    return None


def gen_video(spec):
    model = spec.get("model", "kling-video/v2.1/pro")

    # Map model names to Replicate versions
    model_map = {
        "kling": "kling-ai/kling-video",
        "kling-pro": "kling-ai/kling-video",
        "kling-video/v2.1/pro": "kling-ai/kling-video",
        "kling-video/v2.1/standard": "kling-ai/kling-video",
    }
    model = model_map.get(model, model)

    payload = {
        "input": {
            "image": spec["image_url"],
            "prompt": spec["prompt"],
            "duration": spec.get("duration", 5),
        }
    }

    if spec.get("negative_prompt"):
        payload["input"]["negative_prompt"] = spec["negative_prompt"]
    if spec.get("end_image_url"):
        payload["input"]["end_image"] = spec["end_image_url"]

    print(f"[video] {spec['name']} → {model}")
    resp = requests.post(f"{REPLICATE_API_URL}/predictions", headers=auth_headers(), json=payload, timeout=30)
    print(f"[video] submit → {resp.status_code}")
    if not resp.ok:
        print(f"FAILED: {resp.text[:300]}")
        return None

    data = resp.json()
    prediction_id = data.get("id")
    if not prediction_id:
        print(f"no prediction_id: {data}")
        return None

    print(f"[video] queued: {prediction_id}")
    url = poll_prediction(prediction_id, timeout=1200, kind="video")
    if url:
        out = spec.get("out") or os.path.join(PROJECT, "assets", "clips", f"{spec['name']}.mp4")
        download(url, out)
        print(f"URL: {url}")
    return url


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "image":
        gen_image(json.loads(sys.argv[2]))
    elif cmd == "upload":
        upload_image(sys.argv[2])
    elif cmd == "video":
        gen_video(json.loads(sys.argv[2]))
    else:
        print(f"unknown command {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
