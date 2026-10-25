// Stand-in for the OpenRouter API that i-HR calls to read résumés.
// It answers POST /v1/chat/completions the way the real API does, but builds the
// result from labelled lines in the résumé text (SKILLS:, YEARS:, EDUCATION:),
// so tests are fast, free, offline and fully predictable.
import { createServer } from 'node:http';

const port = Number(process.env.MOCK_AI_PORT ?? 4010);

function field(text, label) {
  const match = text.match(new RegExp(`${label}:\\s*([^\\n]+?)(?=\\s+[A-Z]{3,}:|\\n|$)`, 'i'));
  return match?.[1]?.trim() ?? null;
}

function parseResume(text) {
  const skills = (field(text, 'SKILLS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    full_name: field(text, 'NAME'),
    email: field(text, 'EMAIL'),
    phone: text.match(/PHONE:\s*(\+?[\d][\d\s-]*\d)/i)?.[1] ?? null,
    skills,
    education: field(text, 'EDUCATION'),
    years_experience: Number(field(text, 'YEARS') ?? 0),
  };
}

createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'POST' && req.url?.endsWith('/chat/completions')) {
      const messages = JSON.parse(body || '{}').messages ?? [];
      const resumeText = messages.find((m) => m.role === 'user')?.content ?? '';
      const content = JSON.stringify(parseResume(resumeText));
      res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }));
      return;
    }

    if (req.url === '/health') {
      res.end('{"ok":true}');
      return;
    }

    res.statusCode = 404;
    res.end('{"error":"not mocked"}');
  });
}).listen(port, '127.0.0.1', () => console.log(`mock AI listening on ${port}`));
