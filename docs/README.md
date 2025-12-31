# Collections Chatbot

A modern Next.js chatbot application that integrates with xAI Collections to enable conversational search through your document collections.

## Features

- 🤖 **Chat Interface**: Clean, modern chat UI with real-time messaging
- 🔍 **Collections Search**: Automatically searches your collection documents using semantic search
- 📚 **Citations**: Shows source documents for each response
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- ⚡ **Fast**: Built with Next.js 14 for optimal performance
- 🚀 **Vercel Ready**: Optimized for deployment on Vercel

## Prerequisites

- Node.js 18+ installed
- An xAI API key ([Get one here](https://console.x.ai))
- A collection ID (already configured: `collection_b357d27a-6e14-42e2-ac02-d9d8ae9533a2`)

## Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   XAI_API_KEY=your_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. **Push your code to GitHub** (or your preferred Git provider)

2. **Import your project to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Add environment variables**:
   - In Vercel project settings, add `XAI_API_KEY` with your API key value

4. **Deploy**:
   - Vercel will automatically deploy your project
   - Your chatbot will be live!

## Configuration

The collection ID is currently hardcoded in `app/api/chat/route.ts`. To change it:

1. Edit `app/api/chat/route.ts`
2. Update the `COLLECTION_ID` constant, or
3. Use an environment variable by adding `COLLECTION_ID` to your `.env.local` and updating the code to read from `process.env.COLLECTION_ID`

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API route for chat
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat page
├── components/
│   ├── ChatInput.tsx             # Input component
│   └── ChatMessage.tsx           # Message display component
├── types/
│   └── index.ts                  # TypeScript types
└── package.json                  # Dependencies
```

## Usage

1. Start a conversation by typing a question
2. The chatbot will search through your collection documents
3. Responses include citations showing which documents were referenced
4. Ask follow-up questions to continue the conversation

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **xAI REST API**: Collections search integration via Responses API
- **CSS Modules**: Component-scoped styling

## License

MIT

