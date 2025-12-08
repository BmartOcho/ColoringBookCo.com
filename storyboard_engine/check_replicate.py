import os
import replicate
from dotenv import load_dotenv

load_dotenv()

def check_replicate():
    candidates = [
        "tencentarc/photomaker",
        "stability-ai/sdxl"
    ]
    
    client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))
    
    for model_name in candidates:
        try:
            print(f"Checking model: {model_name}...")
            model = client.models.get(model_name)
            latest_version = model.latest_version
            print(f"SUCCESS: {model_name}")
            print(f"Latest Version ID: {latest_version.id}")
            return latest_version.id
        except Exception as e:
            print(f"Failed {model_name}: {e}")
    
    return None

if __name__ == "__main__":
    check_replicate()
