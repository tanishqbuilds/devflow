import os
import httpx
from openai import AsyncOpenAI

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "mistral")

# OpenAI environment variables for fallback or alternative use
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "dummy-key-for-local")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

def get_llm_client() -> AsyncOpenAI:
    """
    Returns a configured AsyncOpenAI client based on the provider.
    For Ollama, it wraps the OpenAI-compatible v1 endpoint.
    """
    if LLM_PROVIDER.lower() == "ollama":
        # Ollama exposes an OpenAI-compatible endpoint at /v1
        base_url = f"{OLLAMA_BASE_URL.rstrip('/')}/v1"
        return AsyncOpenAI(
            api_key="ollama", # Dummy key required by OpenAI client
            base_url=base_url
        )
    else:
        return AsyncOpenAI(
            api_key=OPENAI_API_KEY,
            base_url=OPENAI_BASE_URL
        )

def get_model_name() -> str:
    """
    Returns the model name configured for the provider.
    """
    return LLM_MODEL
