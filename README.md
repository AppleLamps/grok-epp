# Epstein Files Analyzer

A modern, mobile-responsive Next.js chatbot for searching and analyzing DOJ-released Jeffrey Epstein case documents using AI-powered semantic search.

## Features

- **AI-Powered Search** - Semantic search through thousands of DOJ documents using xAI's Grok model
- **Source Citations** - Every response includes citations to specific documents
- **Conversation History** - Persistent chat history with multiple conversation support
- **Mobile Responsive** - Fully optimized for mobile devices with hamburger menu navigation
- **Real-time Chat** - Clean, modern chat interface with loading states
- **Markdown Support** - Rich text formatting with GitHub Flavored Markdown

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **AI**: xAI Responses API with Grok model
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- npm or yarn
- xAI API key ([Get one here](https://console.x.ai))

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd grok-epp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   XAI_API_KEY=your_xai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
grok-epp/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Chat API endpoint
│   ├── globals.css           # Global styles & CSS variables
│   ├── layout.tsx            # Root layout with fonts
│   ├── page.tsx              # Main chat page
│   └── page.module.css       # Page styles
├── components/
│   ├── ChatInput.tsx         # Message input component
│   ├── ChatMessage.tsx       # Message display with markdown
│   └── Sidebar.tsx           # Conversation history sidebar
├── types/
│   └── index.ts              # TypeScript interfaces
├── docs/                     # Additional documentation
├── .env.example              # Environment variables template
├── vercel.json               # Vercel deployment config
└── package.json
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XAI_API_KEY` | Yes | Your xAI API key for the Responses API |

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/grok-epp&env=XAI_API_KEY&envDescription=Your%20xAI%20API%20key)

### Manual Deploy

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Add the environment variable:
   - `XAI_API_KEY`: Your xAI API key

4. Deploy - Vercel will automatically build and deploy

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run verify` | Verify setup configuration |

## Mobile Support

The application is fully responsive with:
- Hamburger menu for sidebar navigation on screens < 900px
- Touch-optimized interactions (tap to show timestamps)
- Optimized viewport settings for mobile browsers
- Safe area insets for notched devices

## Configuration

The collection ID for document search is configured in `app/api/chat/route.ts`. To use a different collection:

1. Update the `COLLECTION_ID` constant in the route file, or
2. Add `COLLECTION_ID` to your environment variables

## License

MIT
