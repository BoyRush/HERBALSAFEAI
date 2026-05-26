import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "llama-3.1-8b-instant"

def call_groq(prompt, system_prompt=None, temperature=0.2, max_tokens=2048, response_format=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
        
    messages.append({"role": "user", "content": prompt})
    
    kwargs = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    
    if response_format == "json":
        kwargs["response_format"] = {"type": "json_object"}

    try:
        chat_completion = client.chat.completions.create(**kwargs)
        result = chat_completion.choices[0].message.content
        return result
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return None
