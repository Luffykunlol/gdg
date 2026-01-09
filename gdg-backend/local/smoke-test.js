// Simple smoke test for local server: hits /models and /analyze
const SERVER = process.env.SERVER_URL || 'http://localhost:5000';

async function run() {
  try {
    console.log('Server:', SERVER);

    // GET /models
    try {
      const mres = await fetch(`${SERVER}/models`);
      if (mres.ok) {
        const md = await mres.json();
        console.log('/models ->', JSON.stringify(md, null, 2));
      } else {
        console.warn('/models ->', mres.status, await mres.text());
      }
    } catch (e) {
      console.warn('/models failed:', e.message || e);
    }

    // POST /analyze
    const body = {
      documentText: 'Smoke test document content.',
      question: 'Is this a smoke test?',
      language: 'English'
    };

    const ares = await fetch(`${SERVER}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const ad = await ares.json();
    console.log('/analyze ->', JSON.stringify(ad, null, 2));

    if (!ares.ok) process.exitCode = 2;
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exitCode = 1;
  }
}

// Node 18+ has fetch globally; if not, instruct the user.
if (typeof fetch === 'undefined') {
  console.error('Global fetch is not available in this Node runtime. Use Node 18+.');
  process.exit(1);
}

run();
