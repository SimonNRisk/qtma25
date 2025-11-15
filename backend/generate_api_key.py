#!/usr/bin/env python3
"""
Script to generate API keys for cron jobs and service-to-service authentication.

Usage:
    python generate_api_key.py <key_name> <user_id>

Example:
    python generate_api_key.py CRON_JOB abc123-def456-ghi789

The script will generate a secure API key and show you how to add it to your .env file.
"""

import secrets
import sys
import os

def generate_api_key() -> str:
    """Generate a secure random API key"""
    # Generate 32 bytes of random data and encode as hex
    # This creates a 64-character hex string
    random_bytes = secrets.token_bytes(32)
    api_key = "sk_live_" + random_bytes.hex()
    return api_key

def main():
    if len(sys.argv) != 3:
        print("Usage: python generate_api_key.py <key_name> <user_id>")
        print("\nExample:")
        print("  python generate_api_key.py CRON_JOB abc123-def456-ghi789")
        print("\nThe key_name will be used as the environment variable suffix:")
        print("  API_KEY_<key_name>=<generated_key>:<user_id>")
        sys.exit(1)
    
    key_name = sys.argv[1].upper()
    user_id = sys.argv[2]
    
    # Validate key name (alphanumeric and underscores only)
    if not key_name.replace("_", "").isalnum():
        print("Error: Key name must contain only letters, numbers, and underscores")
        sys.exit(1)
    
    # Generate API key
    api_key = generate_api_key()
    
    # Display results
    print("\n" + "="*70)
    print("API Key Generated Successfully!")
    print("="*70)
    print(f"\nKey Name: {key_name}")
    print(f"User ID: {user_id}")
    print(f"\nAPI Key: {api_key}")
    print("\n" + "-"*70)
    print("Add this to your .env file:")
    print("-"*70)
    print(f"\nAPI_KEY_{key_name}={api_key}:{user_id}\n")
    print("="*70)
    print("\nUsage in HTTP requests:")
    print("  Authorization: Bearer " + api_key)
    print("  or")
    print("  Authorization: ApiKey " + api_key)
    print("\n" + "="*70)

if __name__ == "__main__":
    main()

