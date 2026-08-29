import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn.error")

STORE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_store")
USERS_FILE = os.path.join(STORE_DIR, "users_store.json")
PROBLEMS_FILE = os.path.join(STORE_DIR, "problems_store.json")

os.makedirs(STORE_DIR, exist_ok=True)

def load_json_file(file_path: str) -> List[Dict[Any, Any]]:
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning("Failed to load JSON file %s: %s", file_path, e)
        return []

def save_json_file(file_path: str, data: List[Dict[Any, Any]]):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning("Failed to save JSON file %s: %s", file_path, e)

def save_user_persistently(user_dict: Dict[str, Any]):
    users = load_json_file(USERS_FILE)
    # Deduplicate by email
    updated = [u for u in users if u.get("email") != user_dict.get("email")]
    updated.insert(0, user_dict)
    save_json_file(USERS_FILE, updated)

def get_all_persistent_users() -> List[Dict[str, Any]]:
    return load_json_file(USERS_FILE)

def save_problem_persistently(problem_dict: Dict[str, Any]):
    problems = load_json_file(PROBLEMS_FILE)
    # Deduplicate by ticket_code or id
    updated = [p for p in problems if p.get("ticket_code") != problem_dict.get("ticket_code")]
    updated.insert(0, problem_dict)
    save_json_file(PROBLEMS_FILE, updated)

def get_all_persistent_problems() -> List[Dict[str, Any]]:
    return load_json_file(PROBLEMS_FILE)
