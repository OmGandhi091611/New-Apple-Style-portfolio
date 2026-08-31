export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, fileBase64 } = req.body ?? {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!fileBase64) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || 'academic-portfolio';
  const filePath = 'public/Om_Amit_Gandhi_Resume.pdf';

  if (!owner || !repo || !token) {
    return res.status(500).json({ error: 'Server misconfigured — missing GitHub env vars' });
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'om-portfolio-resume-uploader',
  };

  // Fetch current file SHA (required by GitHub API to update an existing file)
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  let sha;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  } else if (getRes.status !== 404) {
    return res.status(502).json({ error: 'Failed to reach GitHub API' });
  }

  // Commit the new PDF
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'chore: update resume PDF',
      content: fileBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.message ?? 'GitHub API error' });
  }

  return res.status(200).json({ success: true });
}
