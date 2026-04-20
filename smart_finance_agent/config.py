import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve the Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set. Please set it in the .env file.")

# Model configuration
MODEL_NAME = "llama-3.3-70b-versatile"
TEMPERATURE = 0.0
