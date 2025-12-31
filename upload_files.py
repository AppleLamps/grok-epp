#!/usr/bin/env python3
"""
Script to upload all files from a directory to an xAI Collection.
Recursively processes all files in subdirectories.
"""

import os
import sys
import time
from pathlib import Path
from threading import Lock
import mimetypes
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from xai_sdk import Client
except ImportError:
    print("Error: xai-sdk package not installed.")
    print("Install it with: pip install xai-sdk")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    # Load environment variables from .env file
    load_dotenv()
except ImportError:
    # python-dotenv not installed, will use system environment variables
    pass

# Configuration
COLLECTION_ID = "collection_8b792b21-5c87-47c6-901b-0395a6589e33"

# One or more directories to scan for files.
# If you want to keep this script CLI-free, edit this list.
SOURCE_DIRECTORIES = [
    r"C:\Users\lucas\Desktop\talk-with-files\files\VOL00008",
]

# File extensions to skip (optional - modify as needed)
SKIP_EXTENSIONS = {
    '.tmp', '.temp', '.log', '.cache', '.swp', '.DS_Store',
    '.git', '.gitignore', '.env', '.env.local'
}

# Maximum file size (in bytes) - set to None for no limit
MAX_FILE_SIZE = None  # e.g., 100 * 1024 * 1024 for 100MB

# Rate-limit tuning (adjust via environment variables if these defaults need to change)
MAX_WORKERS = int(os.getenv("UPLOAD_MAX_WORKERS", "4"))
RATE_LIMIT_INTERVAL = float(os.getenv("UPLOAD_RATE_LIMIT_INTERVAL", "0.3"))
MAX_UPLOAD_RETRIES = int(os.getenv("UPLOAD_MAX_RETRIES", "3"))
BACKOFF_MULTIPLIER = float(os.getenv("UPLOAD_BACKOFF_MULTIPLIER", "2"))

# Shared state needed to pace requests
RATE_LIMIT_LOCK = Lock()
LAST_UPLOAD_TIME = 0.0

def enforce_rate_limit() -> None:
    """Pause so uploads stay under the configured request rate."""
    global LAST_UPLOAD_TIME
    if RATE_LIMIT_INTERVAL <= 0:
        return
    with RATE_LIMIT_LOCK:
        now = time.time()
        next_allowed = LAST_UPLOAD_TIME + RATE_LIMIT_INTERVAL
        if now < next_allowed:
            time.sleep(next_allowed - now)
            now = next_allowed
        LAST_UPLOAD_TIME = now

def is_rate_limit_error(exc: Exception) -> bool:
    """Simple heuristic to catch 429 or rate-limit messaging."""
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None) or getattr(exc, "code", None)
    if status == 429:
        return True
    message = str(exc).lower()
    return "rate limit" in message or "429" in message


def get_content_type(file_path: Path) -> str:
    """Determine content type from file extension."""
    content_type, _ = mimetypes.guess_type(str(file_path))
    
    # Default content types for common file types
    if content_type:
        return content_type
    
    extension = file_path.suffix.lower()
    content_type_map = {
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
    }
    
    return content_type_map.get(extension, 'application/octet-stream')


def should_skip_file(file_path: Path) -> bool:
    """Check if file should be skipped."""
    # Skip hidden files
    if file_path.name.startswith('.'):
        return True
    
    # Skip files with excluded extensions
    if file_path.suffix.lower() in SKIP_EXTENSIONS:
        return True
    
    # Check file size limit
    if MAX_FILE_SIZE:
        try:
            file_size = file_path.stat().st_size
            if file_size > MAX_FILE_SIZE:
                print(f"  ⚠ Skipping {file_path.name} (too large: {file_size / 1024 / 1024:.2f} MB)")
                return True
        except OSError:
            return True
    
    return False


def upload_file(client: Client, file_path: Path, collection_id: str, *, document_name: str) -> bool:
    """Upload a single file to the collection, with retries if rate limited."""
    for attempt in range(1, MAX_UPLOAD_RETRIES + 1):
        try:
            enforce_rate_limit()
            # Read file content
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Determine content type
            content_type = get_content_type(file_path)
            
            # Upload document
            print(f"  📤 Uploading: {document_name} ({len(file_data) / 1024:.2f} KB)")
            
            document = client.collections.upload_document(
                collection_id=collection_id,
                name=document_name,
                data=file_data,
                content_type=content_type,
            )
            
            print(f"  ✅ Success: {document_name} (File ID: {document.file_metadata.file_id})")
            return True
        except Exception as e:
            if is_rate_limit_error(e) and attempt < MAX_UPLOAD_RETRIES:
                backoff = RATE_LIMIT_INTERVAL + (BACKOFF_MULTIPLIER ** attempt)
                print(f"  ⚠ Rate limited on {document_name}; retrying in {backoff:.1f}s (attempt {attempt}/{MAX_UPLOAD_RETRIES})")
                time.sleep(backoff)
                continue
            print(f"  ❌ Error uploading {document_name}: {str(e)}")
            return False
    return False


def upload_file_parallel(args):
    """Helper function for parallel file uploads."""
    client, file_path, collection_id, document_name = args
    return upload_file(client, file_path, collection_id, document_name=document_name)


def main():
    """Main function to upload all files."""
    # Validate source directories
    source_paths = [Path(p) for p in SOURCE_DIRECTORIES]
    invalid_paths = [p for p in source_paths if not p.exists() or not p.is_dir()]
    if invalid_paths:
        print("Error: One or more source directories are missing or not directories:")
        for p in invalid_paths:
            print(f"  - {p}")
        sys.exit(1)
    
    # Get API keys from environment (loaded from .env file if available)
    api_key = os.getenv("XAI_API_KEY")
    management_api_key = os.getenv("XAI_MANAGEMENT_API_KEY")
    
    if not api_key:
        print("Error: XAI_API_KEY environment variable not set")
        print("Please set it in your .env file or as an environment variable")
        sys.exit(1)
    
    if not management_api_key:
        print("Warning: XAI_MANAGEMENT_API_KEY not set.")
        print("Using XAI_API_KEY for uploads (may not work for all operations).")
        print("For best results, set XAI_MANAGEMENT_API_KEY in your .env file.")
        management_api_key = api_key
    else:
        print("✅ Using Management API Key for uploads")
    
    # Initialize client
    print("Initializing xAI client...")
    try:
        client = Client(
            api_key=api_key,
            management_api_key=management_api_key,
            timeout=3600,  # Longer timeout for large files
        )
    except Exception as e:
        print(f"Error initializing client: {str(e)}")
        sys.exit(1)
    
    # Verify collection exists
    print(f"Verifying collection: {COLLECTION_ID}")
    try:
        collection = client.collections.get(COLLECTION_ID)
        # Collection retrieved successfully
        collection_name = getattr(collection, 'name', 'Unknown')
        print(f"✅ Collection found: {collection_name}")
        print(f"   Collection ID: {getattr(collection, 'id', COLLECTION_ID)}")
        
        # Debug: Show collection attributes (optional, can be removed later)
        if hasattr(collection, '__dict__'):
            print(f"   Available attributes: {list(collection.__dict__.keys())}")
    except Exception as e:
        print(f"Error: Could not access collection: {str(e)}")
        print(f"Make sure the collection ID is correct: {COLLECTION_ID}")
        print(f"\nDebug info - Exception type: {type(e).__name__}")
        sys.exit(1)
    
    # Find all files recursively
    print("\nScanning directories:")
    for p in source_paths:
        print(f"  - {p}")

    all_files: list[Path] = []
    seen_files: set[Path] = set()
    for source_path in source_paths:
        for root, dirs, files in os.walk(source_path):
            for file in files:
                file_path = (Path(root) / file).resolve()
                if file_path in seen_files:
                    continue
                if not should_skip_file(file_path):
                    all_files.append(file_path)
                    seen_files.add(file_path)
    
    total_files = len(all_files)
    print(f"Found {total_files} files to upload\n")
    
    if total_files == 0:
        print("No files to upload.")
        sys.exit(0)
    
    # Confirm before proceeding
    print(f"Ready to upload {total_files} files to collection: {COLLECTION_ID}")
    response = input("Continue? (y/n): ").strip().lower()
    if response != 'y':
        print("Upload cancelled.")
        sys.exit(0)
    
    # Upload files in parallel
    print("\n" + "="*60)
    print("Starting upload process (parallel)...")
    print("="*60 + "\n")
    
    # Create client instances for each worker (reuse same auth)
    max_workers_for_run = max(1, MAX_WORKERS)
    workers = min(max_workers_for_run, total_files)
    print(f"Using {workers} parallel workers\n")
    
    # Prepare upload tasks
    upload_tasks = []
    for idx, file_path in enumerate(all_files, 1):
        matching_bases = [p for p in source_paths if str(file_path).lower().startswith(str(p.resolve()).lower() + os.sep)]
        base_path = max(matching_bases, key=lambda p: len(str(p))) if matching_bases else None
        relative_path = file_path.relative_to(base_path) if base_path else file_path.name
        base_label = base_path.name if base_path else "files"
        relative_path_str = relative_path.as_posix() if isinstance(relative_path, Path) else str(relative_path)
        document_name = f"{base_label}/{relative_path_str}"
        upload_tasks.append((client, file_path, COLLECTION_ID, document_name))
    
    # Upload in parallel
    successful = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(upload_file_parallel, task): task for task in upload_tasks}
        
        for future in as_completed(futures):
            task = futures[future]
            document_name = task[3]
            try:
                if future.result():
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"  ❌ Error uploading {document_name}: {str(e)}")
                failed += 1
    
    # Summary
    print("="*60)
    print("Upload Summary")
    print("="*60)
    print(f"Total files: {total_files}")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"Collection ID: {COLLECTION_ID}")
    print("="*60)


if __name__ == "__main__":
    main()

