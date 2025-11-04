## Shorts Agent

Full-stack Next.js agent that orchestrates short-form content creation with Gemini prompts and publishes finished cuts straight to YouTube.

### Features

- Gemini-powered script + concept generation tailored for YouTube Shorts
- Structured creative package (script, shots, CTA, hashtags)
- Integrated OAuth workflow to upload rendered videos to YouTube
- Minimal, responsive UI deployable on Vercel

### Environment

Create a `.env.local` file based on `.env.example`:

```
GEMINI_API_KEY=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...
```

> The YouTube values come from a web application OAuth client with `https://www.googleapis.com/auth/youtube.upload` scope. The refresh token should be generated once via the OAuth consent flow.

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to use the agent locally.

### Production

Build and start the production bundle:

```bash
npm run build
npm start
```

The app is optimized for deployment on Vercel (`vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-d3337074`).
