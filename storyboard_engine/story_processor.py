import os
import json
import google.generativeai as genai
from typing import List, Dict

class StoryProcessor:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Google API Key is required for StoryProcessor")
        genai.configure(api_key=api_key)
        genai.configure(api_key=api_key)
        # using gemini-2.0-flash as confirmed by check_models.py
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def process_story(self, story_text: str) -> List[str]:
        """
        Breaks down a story into a list of image prompts.
        """
        prompt = f"""
        You are an expert storyboard artist. 
        Read the following story and break it down into a sequence of vivid, descriptive image prompts for an AI image generator.
        
        The style should be: "black and white coloring book page, clean line art, no shading, white background".
        
        Story:
        {story_text}
        
        Rules:
        1. Return ONLY a JSON array of strings.
        2. Each string should be a standalone prompt describing the scene.
        3. Include "(character)" in the prompt where the main character appears, so we can replace it later if needed, or keep it generic.
        4. Focus on visual action.
        
        Example Output:
        ["coloring book page, line art, heavy black lines, white background, (character) walking through a spooky forest", "coloring book page, line art, close up of (character) looking surprised at a owl"]
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Clean up potential markdown code blocks
            text = response.text.replace('```json', '').replace('```', '').strip()
            prompts = json.loads(text)
            return prompts
        except Exception as e:
            print(f"Error generating prompts: {e}")
            return []

if __name__ == "__main__":
    # Test
    import sys
    key = os.getenv("GOOGLE_API_KEY")
    if key:
        sp = StoryProcessor(key)
        print(sp.process_story("Alice fell down the rabbit hole."))
    else:
        print("Set GOOGLE_API_KEY to test.")
