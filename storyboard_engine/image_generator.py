import os
import replicate
from typing import List

class ImageGenerator:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Replicate API Key is required for ImageGenerator")
        self.client = replicate.Client(api_token=api_key)
        # Using a model that supports IP-Adapter or similar strong style/character transfer.
        # This is a popular IP-Adapter SDXL implementation.
        self.model_version = "lucataco/ip-adapter-sdxl:some-hash-placeholder" 
        # Note: In production code we should lookup the latest version hash or use the model alias if stable.
        # checking "lucataco/ip-adapter-sdxl" or "tstramer/ip-adapter-sdxl"
        
    def generate_scene(self, prompt: str, source_image_path: str, output_path: str):
        """
        Generates a scene using the prompt and the source image for character consistency.
        """
        print(f"Generating scene: {prompt[:50]}...")
        
        try:
            # Fallback to standard SDXL for reliability
            # This uses Image-to-Image to keep general structure/colors of source
            
            # We open the file safely
            with open(source_image_path, "rb") as source_file:
                input_args = {
                    "prompt": prompt + ", line art, coloring book style, black and white",
                    "image": source_file,
                    "prompt_strength": 0.5, # How much to respect the source image
                    "negative_prompt": "shading, gradient, gray, color, text, watermark, blurry, realistic, photo, 3d render",
                    "num_outputs": 1
                }
                
                # Using the official Stable Diffusion XL model
                output = self.client.run(
                    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", 
                    input=input_args
                )
            
            # Application of IP adapter often returns a list of URLs
            if output:
                image_url = output[0]
                import requests
                img_data = requests.get(image_url).content
                with open(output_path, 'wb') as f:
                    f.write(img_data)
                print(f"Saved to {output_path}")
                return True
                
        except Exception as e:
            print(f"Error generating image: {e}")
            return False

if __name__ == "__main__":
    pass
