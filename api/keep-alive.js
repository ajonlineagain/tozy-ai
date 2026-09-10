import https from 'https';

export default async function handler(req, res) {
  // Use private server-side env vars (no VITE_ prefix — not exposed to browser)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured.' });
  }

  try {
    // Lightweight REST ping — hits the Supabase health endpoint
    const url = new URL('/rest/v1/', supabaseUrl);

    await new Promise((resolve, reject) => {
      const req = https.get(url.toString(), {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }, (response) => {
        // Drain body to free socket
        response.resume();
        resolve(response.statusCode);
      });
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
    });

    const timestamp = new Date().toISOString();
    console.log(`[keep-alive] Supabase pinged at ${timestamp}`);
    return res.status(200).json({ ok: true, pinged_at: timestamp });

  } catch (err) {
    console.error('[keep-alive] Ping failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
