"""LLM client configuration and utilities."""
from typing import Optional
from functools import lru_cache

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic

from app.core.config import settings


class LLMClients:
    """Container for LLM clients."""

    _instance: Optional["LLMClients"] = None

    def __init__(self):
        self._openai_clients = {}
        self._google_clients = {}
        self._anthropic_clients = {}

    @classmethod
    def get_instance(cls) -> "LLMClients":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_openai(self, model: str = "gpt-5-mini", temperature: float = 0.7) -> ChatOpenAI:
        """Get OpenAI client."""
        key = (model, temperature)
        if key not in self._openai_clients:
            self._openai_clients[key] = ChatOpenAI(
                model=model,
                temperature=temperature,
                api_key=settings.OPENAI_API_KEY,
            )
        return self._openai_clients[key]

    def get_google(self, model: str = "gemini-3-flash-preview", temperature: float = 1.0) -> ChatGoogleGenerativeAI:
        """Get Google Gemini client.

        Note: Gemini 3 recommends temperature=1.0 as default.
        thinking_level parameter is not yet supported in langchain-google-genai.
        """
        key = (model, temperature)
        if key not in self._google_clients:
            self._google_clients[key] = ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                google_api_key=settings.GOOGLE_API_KEY,
            )
        return self._google_clients[key]

    def get_anthropic(self, model: str = "claude-sonnet-4-5-20250929", temperature: float = 0.7) -> ChatAnthropic:
        """Get Anthropic Claude client.

        Note: Claude 4.5 does not allow both temperature and top_p to be specified.
        Only temperature is used here.
        """
        key = (model, temperature)
        if key not in self._anthropic_clients:
            self._anthropic_clients[key] = ChatAnthropic(
                model=model,
                temperature=temperature,
                api_key=settings.ANTHROPIC_API_KEY,
            )
        return self._anthropic_clients[key]


def get_llm_clients() -> LLMClients:
    """Get LLM clients instance."""
    return LLMClients.get_instance()


# Model aliases for easy access
# These map shorthand names to actual API model IDs
MODEL_ALIASES = {
    # OpenAI GPT-5 family
    "gpt-5.2": "gpt-5.2",
    "gpt-5": "gpt-5",
    "gpt-5-mini": "gpt-5-mini",
    "gpt-5-nano": "gpt-5-nano",

    # Google Gemini 3 family
    "gemini-3-pro": "gemini-3-pro-preview",
    "gemini-3-flash": "gemini-3-flash-preview",

    # Anthropic Claude 4.5 family
    "claude-opus-4.5": "claude-opus-4-5-20251124",
    "claude-sonnet-4.5": "claude-sonnet-4-5-20250929",
    "claude-haiku-4.5": "claude-haiku-4-5-20251001",
}


def get_model(model_alias: str, temperature: float = 0.7):
    """Get a model by alias name."""
    actual_model = MODEL_ALIASES.get(model_alias, model_alias)
    clients = get_llm_clients()

    if actual_model.startswith("gpt"):
        return clients.get_openai(actual_model, temperature)
    elif actual_model.startswith("gemini"):
        return clients.get_google(actual_model, temperature)
    elif actual_model.startswith("claude"):
        return clients.get_anthropic(actual_model, temperature)
    else:
        # Default to OpenAI
        return clients.get_openai(actual_model, temperature)
