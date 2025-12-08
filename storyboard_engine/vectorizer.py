import os
import subprocess

class Vectorizer:
    def __init__(self):
        # Check for potrace
        try:
            subprocess.run(["potrace", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            self.has_potrace = True
        except (FileNotFoundError, subprocess.CalledProcessError):
            self.has_potrace = False
            print("WARNING: 'potrace' not found in PATH. Vectorization will be skipped or fail.")
            print("Please install Potrace from http://potrace.sourceforge.net/ and add it to your System PATH.")

    def vectorize(self, input_image_path: str, output_svg_path: str):
        if not self.has_potrace:
            print(f"Skipping vectorization for {input_image_path} (Potrace missing).")
            return False

        # Convert to BMP first (Potrace limitation: usually likes BMP or PGM)
        # Using ImageMagick or PIL to convert to BMP if needed?
        # Potrace supports BMP. PIL can save as BMP.
        
        try:
            from PIL import Image
            bmp_path = os.path.splitext(input_image_path)[0] + ".bmp"
            
            with Image.open(input_image_path) as img:
                 # Potrace expects black and white
                bw = img.convert("1", dither=Image.Dither.NONE)
                bw.save(bmp_path)

            # Run potrace
            # -s for SVG, -o for output
            subprocess.run(["potrace", bmp_path, "-s", "-o", output_svg_path], check=True)
            
            # Clean up BMP
            if os.path.exists(bmp_path):
                os.remove(bmp_path)
                
            print(f"Vectorized to {output_svg_path}")
            return True

        except Exception as e:
            print(f"Vectorization failed: {e}")
            return False
