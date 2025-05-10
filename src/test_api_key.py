import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("The API KEY is:", os.environ.get("API_KEY"))
