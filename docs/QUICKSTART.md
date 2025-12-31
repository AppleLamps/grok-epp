# 🚀 Quick Start Guide

This guide will get your Collections Chatbot up and running in 5 minutes.

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [ ] **xAI API Key** from [console.x.ai](https://console.x.ai)
- [ ] **Collection ID**: `collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2` (already configured)
- [ ] **Documents uploaded** to your collection (483 documents currently uploaded)

## 🔧 Setup Steps

### Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

This will install all required packages (Next.js, React, TypeScript, etc.)

### Step 2: Configure Environment Variables

1. **Copy the example file**:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```

2. **Edit `.env.local`** and add your API key:
   ```env
   XAI_API_KEY=xai-your-actual-api-key-here
   ```

   > **Note**: The file already contains your API key if you've set it up previously.

### Step 3: Verify Setup

Run the verification script to ensure everything is configured correctly:

```powershell
node verify-setup.js
```

This will check:
- ✅ Dependencies are installed
- ✅ Environment variables are set
- ✅ All required files exist
- ✅ Collection ID is configured

### Step 4: Start the Development Server

```powershell
npm run dev
```

You should see output like:

```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

### Step 5: Open Your Browser

Navigate to: **http://localhost:3000**

You should see the Collections Chatbot interface! 🎉

## 🧪 Test Your Setup

Try asking questions like:

- "What documents are in this collection?"
- "Summarize the key information about Epstein"
- "What are the main topics covered in these files?"

The chatbot will search through your 483+ uploaded documents and provide answers with citations.

## 🐛 Troubleshooting

### Issue: "XAI_API_KEY environment variable is not set"

**Solution**: 
1. Make sure `.env.local` exists in the root directory
2. Verify the API key is correctly set without quotes
3. Restart the dev server after changing `.env.local`

### Issue: "Cannot find module" errors

**Solution**: 
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: Port 3000 already in use

**Solution**: 
```powershell
# Use a different port
npm run dev -- -p 3001
```

Then open: http://localhost:3001

### Issue: No responses from the chatbot

**Solution**:
1. Check browser console (F12) for errors
2. Verify your API key is valid at [console.x.ai](https://console.x.ai)
3. Ensure your collection has documents uploaded
4. Check the terminal for API error messages

## 📊 Current Status

- ✅ **Upload Script**: Working correctly (fixed)
- ✅ **Collection ID**: `collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2`
- ✅ **Documents**: 483+ PDFs uploaded
- ✅ **API Integration**: Configured with Responses API
- ✅ **Model**: Using `grok-2-1212`

## 🚀 Deployment to Production

### Option 1: Vercel (Recommended)

1. **Push to GitHub**:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable: `XAI_API_KEY`
   - Click "Deploy"

3. **Done!** Your chatbot will be live at `your-project.vercel.app`

### Option 2: Build for Production Locally

```powershell
# Build the production version
npm run build

# Start the production server
npm start
```

## 📚 Next Steps

- **Customize the UI**: Edit `app/page.tsx` and CSS files
- **Add more features**: Modify `app/api/chat/route.ts`
- **Upload more documents**: Use `upload_files.py`
- **Change collection**: Update `COLLECTION_ID` in `app/api/chat/route.ts`

## 🆘 Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review [SETUP.md](./SETUP.md) for advanced configuration
- Check [UPLOAD_README.md](./UPLOAD_README.md) for document upload help

---

**Happy chatting! 🤖💬**
