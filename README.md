# Emotional Intelligence Dashboard

## Setup & Running Locally

1. **Prerequisites**:
   - Node.js (v20+)

2. **Installation**:
   ```bash
   npm install
   ```

3. **Environment**:
   - Create a `.env` file in the root directory with:
     ```
     DEEPGRAM_API_KEY=your_deepgram_key
     DEEPGRAM_MODEL=nova-3
     ```

4. **Running**:
   ```bash
   npm run dev
   ```
   Open http://localhost:5000 in your browser.

## Features
- Audio upload and analysis (local proxy to Deepgram APIs)
- Speaker-diarized transcripts
- Sentiment analysis visualization
- Conflict and insight detection

## Project Structure
- `client/`: React frontend
- `server/`: Express backend
- `shared/`: Shared types and schemas
