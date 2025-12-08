import os
import time
import shutil
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dotenv import load_dotenv

from story_processor import StoryProcessor
from image_generator import ImageGenerator
from vectorizer import Vectorizer

# Load .env
load_dotenv()

INPUT_DIR = "input_stories"
PROCESSED_DIR = "processed_stories"
OUTPUT_DIR = "output_storyboards"

class StoryboardHandler(FileSystemEventHandler):
    def __init__(self):
        self.processing = False
        # Initialize modules
        google_key = os.getenv("GOOGLE_API_KEY")
        replicate_key = os.getenv("REPLICATE_API_TOKEN")
        
        if not google_key or not replicate_key:
            print("CRITICAL: Missing API Keys in .env file.")
            
        self.story_processor = StoryProcessor(google_key) if google_key else None
        self.image_generator = ImageGenerator(replicate_key) if replicate_key else None
        self.vectorizer = Vectorizer()

    def on_created(self, event):
        if event.is_directory:
            return
        
        # We look for a specific trigger, maybe when 'story.txt' matches 'source.png'
        # Simple Logic: If a folder inside INPUT_DIR has both 'story.txt' and 'source.png', process it.
        # Check the parent folder of the created file.
        
        filename = os.path.basename(event.src_path)
        # Use absolute path for reliability
        directory = os.path.abspath(os.path.dirname(event.src_path))
        
        if filename in ["story.txt", "source.png"]:
            # Give the filesystem a moment to unlock files (Windows copy behavior)
            time.sleep(1)
            self.check_and_process(directory)

    def check_and_process(self, directory):
        if self.processing: 
            return # Simple lock
            
        story_path = os.path.join(directory, "story.txt")
        source_path = os.path.join(directory, "source.png")
        
        if os.path.exists(story_path) and os.path.exists(source_path):
            print(f"Input found in {directory}! Starting processing...")
            self.processing = True
            try:
                self.run_pipeline(directory, story_path, source_path)
                # Move to processed directory to prevent re-triggering
                project_name = os.path.basename(directory)
                timestamp = int(time.time())
                dest_path = os.path.join(PROCESSED_DIR, f"{project_name}_{timestamp}")
                shutil.move(directory, dest_path)
                print(f"Moved input to {dest_path}")
            except Exception as e:
                print(f"Pipeline failed: {e}")
            finally:
                self.processing = False

    def run_pipeline(self, input_dir, story_path, source_path):
        timestamp = int(time.time())
        project_name = os.path.basename(input_dir)
        output_folder = os.path.join(OUTPUT_DIR, f"{project_name}_{timestamp}")
        os.makedirs(output_folder, exist_ok=True)

        print("1. Reading Story...")
        with open(story_path, 'r', encoding='utf-8') as f:
            story_text = f.read()

        if self.story_processor:
            print("2. Generating Prompts...")
            prompts = self.story_processor.process_story(story_text)
        else:
            print("Skipping AI story processing (No Key). Using dummy prompts.")
            prompts = ["scene 1", "scene 2"]

        print(f"   Generated {len(prompts)} scenes.")
        
        # Save prompts for specific debug
        with open(os.path.join(output_folder, "prompts.json"), "w") as f:
            json.dump(prompts, f, indent=2)

        print("3. Generating Images...")
        for i, prompt in enumerate(prompts):
            print(f"   Processing Scene {i+1}...")
            raster_filename = f"scene_{i+1:02d}.png"
            raster_path = os.path.join(output_folder, raster_filename)
            
            if self.image_generator:
                success = self.image_generator.generate_scene(prompt, source_path, raster_path)
            else:
                success = False
                print("   Skipping AI Image Gen (No Key).")

            if success:
                print("4. Vectorizing...")
                svg_filename = f"scene_{i+1:02d}.svg"
                svg_path = os.path.join(output_folder, svg_filename)
                self.vectorizer.vectorize(raster_path, svg_path)
            else:
                 print(f"   Failed to generate image for scene {i+1}")

        print(f"Done! Results in {output_folder}")

if __name__ == "__main__":
    # Ensure dirs
    os.makedirs(INPUT_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    event_handler = StoryboardHandler()
    observer = Observer()
    observer.schedule(event_handler, INPUT_DIR, recursive=True)
    observer.start()
    
    print(f"Monitoring '{INPUT_DIR}' for projects containing 'story.txt' and 'source.png'...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
