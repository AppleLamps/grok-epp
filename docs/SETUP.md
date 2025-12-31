# Quick Setup Guide

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env.local` file**:
   ```env
   XAI_API_KEY=your_api_key_here
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable:
     - Name: `XAI_API_KEY`
     - Value: Your xAI API key
   - Click "Deploy"

3. **Your chatbot is live!**

## Collection ID

The collection ID is currently hardcoded in `app/api/chat/route.ts`:
- Collection ID: `collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2`

To change it, edit `app/api/chat/route.ts` and update the `COLLECTION_ID` constant.

