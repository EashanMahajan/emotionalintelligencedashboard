# Emotional Intelligence Dashboard

## Setup & Running Locally

1. **Prerequisites**:
   - Node.js (v20+)
   - PostgreSQL (v15+)

2. **Installation**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   - Create a Postgres database (e.g. `emotional_intelligence`)
   - Create a `.env` file in the root directory with:
     ```
     DATABASE_URL=postgresql://user:password@localhost:5432/emotional_intelligence
     ```
   - Push the schema to the database:
     ```bash
     npm run db:push
     ```

4. **Running**:
   ```bash
   npm run dev
   ```
   Open http://localhost:5000 in your browser.

## Features
- Audio upload and analysis
- Speaker-diarized transcripts
- Sentiment analysis visualization
- Conflict and insight detection

## Project Structure
- `client/`: React frontend
- `server/`: Express backend
- `shared/`: Shared types and schemas
