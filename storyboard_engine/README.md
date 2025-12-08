# Storyboard Engine

This tool automatically generates a storyboard from a single source character image and a text story.

## Prerequisites

1.  **Python 3.10+**
2.  **Potrace** (for vectorization)
    *   Download from: http://potrace.sourceforge.net/#downloading
    *   **Windows**: Download the binary zip, extract `potrace.exe`, and place it in `C:\Windows\System32` OR add its folder to your System PATH.
3.  **API Keys**
    *   **Google Gemini API Key** (for story parsing): [Get Key](https://aistudio.google.com/app/apikey)
    *   **Replicate API Token** (for image generation): [Get Token](https://replicate.com/account/api-tokens)

## Setup

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Configure keys:
    *   Rename `.env.example` to `.env`
    *   Open `.env` and paste your API keys.

## Usage

1.  Run the monitor script:
    ```bash
    python main.py
    ```
    It will start watching the `input_stories` folder.

2.  **Trigger Generation**:
    *   Create a new folder inside `input_stories` (e.g., `input_stories/alice_story`).
    *   Place your story text file named **`story.txt`** inside that folder.
    *   Place your character reference image named **`source.png`** inside that folder.

3.  **Results**:
    *   Check the `output_storyboards` folder for your generated SVGs.

## Customization

*   **Style**: Edit `storyboard_engine/image_generator.py` to change the `prompt` logic or the IP-Adapter model.
*   **Vectorization**: Edit `storyboard_engine/vectorizer.py` to change Potrace settings.
