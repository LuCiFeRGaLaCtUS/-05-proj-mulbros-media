import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

app.use(express.json());

// AI proxy — avoids CORS when calling OpenAI from the browser
// Priority: client-sent Authorization header (from localStorage key in Settings)
// Fallback: OPENAI_API_KEY env var (set on Render for production deploys)
app.post('/api/ai', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || (OPENAI_KEY ? `Bearer ${OPENAI_KEY}` : '');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
