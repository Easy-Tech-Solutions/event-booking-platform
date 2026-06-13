import env from '../config/env.js';

// POST /api/ai/generate
export const generateContent = async (req, res, next) => {
  try {
    if (!env.OPENAI_API_KEY) {
      return res.status(503).json({ message: 'AI generation is not configured. Set OPENAI_API_KEY.' });
    }

    const { type, context } = req.body;
    // type: 'event_description' | 'email_copy' | 'landing_page'
    if (!type || !context) {
      return res.status(400).json({ message: 'type and context are required.' });
    }

    const prompts = {
      event_description: `Write a compelling, engaging event description (2-3 paragraphs, ~150 words) for the following event. Be vivid, highlight key selling points, and end with a call-to-action.

Event details: ${JSON.stringify(context)}

Return only the description text, no extra formatting.`,

      email_copy: `Write a short promotional email (subject line + body, ~100 words) to invite people to attend this event. Tone should be exciting and persuasive.

Event details: ${JSON.stringify(context)}

Format:
Subject: [subject line]
Body: [email body]`,

      landing_page: `Write a punchy event landing page headline, a one-sentence tagline, and three bullet-point highlights for this event.

Event details: ${JSON.stringify(context)}

Format:
Headline: [headline]
Tagline: [tagline]
Highlights:
- [highlight 1]
- [highlight 2]
- [highlight 3]`,
    };

    const prompt = prompts[type];
    if (!prompt) return res.status(400).json({ message: `Unknown type. Use: ${Object.keys(prompts).join(', ')}` });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert event marketing copywriter.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(502).json({ message: 'OpenAI API error.', detail: errBody });
    }

    const data = await response.json();
    const generated = data.choices?.[0]?.message?.content?.trim();

    return res.json({ generated, type });
  } catch (err) { next(err); }
};
