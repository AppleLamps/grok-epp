# File Upload Script

Python script to upload all files from a directory to your xAI Collection.

## Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

   Or install directly:
   ```bash
   pip install xai-sdk
   ```

2. **Set environment variables**:
   
   **Recommended: Create a `.env` file** (automatically loaded by the script):
   ```env
   XAI_API_KEY=your_api_key_here
   XAI_MANAGEMENT_API_KEY=your_management_api_key_here
   ```
   
   Or set environment variables manually:
   
   On Windows (PowerShell):
   ```powershell
   $env:XAI_API_KEY="your_api_key_here"
   $env:XAI_MANAGEMENT_API_KEY="your_management_api_key_here"
   ```
   
   On Windows (Command Prompt):
   ```cmd
   set XAI_API_KEY=your_api_key_here
   set XAI_MANAGEMENT_API_KEY=your_management_api_key_here
   ```
   
   On Linux/Mac:
   ```bash
   export XAI_API_KEY="your_api_key_here"
   export XAI_MANAGEMENT_API_KEY="your_management_api_key_here"
   ```

## Usage

1. **Update the script** (if needed):
   - Edit `SOURCE_DIRECTORY` in `upload_files.py` to change the source directory
   - Edit `COLLECTION_ID` if you want to use a different collection
   - Modify `SKIP_EXTENSIONS` to exclude specific file types
   - Set `MAX_FILE_SIZE` to limit file sizes (in bytes)

2. **Run the script**:
   ```bash
   python upload_files.py
   ```

3. **The script will**:
   - Scan all files recursively in `D:\ep-files`
   - Show you how many files were found
   - Ask for confirmation before uploading
   - Upload each file to your collection
   - Show progress and results for each file
   - Display a summary at the end

## Configuration

### Current Settings

- **Collection ID**: `collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2`
- **Source Directory**: `D:\ep-files`
- **Skipped Extensions**: `.tmp`, `.temp`, `.log`, `.cache`, `.swp`, `.DS_Store`, `.git`, `.gitignore`, `.env`, `.env.local`
- **Max File Size**: None (no limit)

### Customization

Edit `upload_files.py` to customize:

```python
# Change source directory
SOURCE_DIRECTORY = r"D:\your\custom\path"

# Change collection ID
COLLECTION_ID = "your_collection_id_here"

# Add more extensions to skip
SKIP_EXTENSIONS = {
    '.tmp', '.temp', '.log', '.cache',
    '.your_extension'  # Add your extensions here
}

# Set maximum file size (e.g., 100MB)
MAX_FILE_SIZE = 100 * 1024 * 1024
```

## Features

- ✅ Recursively processes all subdirectories
- ✅ Automatically detects file content types
- ✅ Skips hidden files and excluded extensions
- ✅ Shows upload progress with file sizes
- ✅ Handles errors gracefully
- ✅ Provides detailed summary
- ✅ Confirms before starting upload

## Notes

- The script uses the xAI Management API for uploads
- Files are uploaded with their original names
- Content types are automatically detected based on file extensions
- The script will continue even if some files fail to upload
- Maximum of 100,000 files per collection (as per xAI limits)

## Troubleshooting

**Error: "Collection not found"**
- Verify the collection ID is correct
- Make sure you have access to the collection

**Error: "API key not set"**
- Make sure environment variables are set correctly
- Check that you're using the correct API key

**Files not uploading**
- Check file size limits
- Verify you have write permissions to the collection
- Check network connectivity

