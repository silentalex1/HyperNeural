import os
import hashlib
import json
from pathlib import Path
from typing import Optional

class AdminAuth:
    def __init__(self, config_path: Path = None):
        self.config_path = config_path or (Path.home() / ".inferforge" / "admin.json")
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.load_config()
    
    def load_config(self):
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                data = json.load(f)
                self.username = data.get('username', '')
                self.password_hash = data.get('password_hash', '')
                self.is_initialized = True
        else:
            self.username = ''
            self.password_hash = ''
            self.is_initialized = False
    
    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        if not self.is_initialized:
            return False
        return self.hash_password(password) == self.password_hash
    
    def set_credentials(self, username: str, password: str) -> bool:
        self.username = username.strip()
        if not self.username:
            return False
        self.password_hash = self.hash_password(password)
        self.save_config()
        self.is_initialized = True
        return True
    
    def save_config(self):
        config = {
            'username': self.username,
            'password_hash': self.password_hash
        }
        with open(self.config_path, 'w') as f:
            json.dump(config, f)
        os.chmod(self.config_path, 0o600)
    
    def check_credentials(self, username: str, password: str) -> bool:
        if not self.is_initialized:
            return False
        return username == self.username and self.verify_password(password)

def setup_admin_credentials():
    auth = AdminAuth()
    
    if auth.is_initialized:
        print("Admin credentials already set.")
        verify = input("Do you want to update? (y/n): ").lower()
        if verify != 'y':
            return
    
    print("\n=== InferForge Admin Setup ===\n")
    
    username = input("Enter admin username: ").strip()
    if not username:
        print("Username cannot be empty.")
        return
    
    password = input("Enter admin password: ").strip()
    if not password:
        print("Password cannot be empty.")
        return
    
    confirm_pass = input("Confirm password: ").strip()
    if password != confirm_pass:
        print("Passwords do not match.")
        return
    
    if auth.set_credentials(username, password):
        print(f"\nAdmin credentials set successfully!")
        print(f"Username: {username}")
        print(f"Credentials saved to: {auth.config_path}")
    else:
        print("Failed to set credentials.")

if __name__ == "__main__":
    setup_admin_credentials()
