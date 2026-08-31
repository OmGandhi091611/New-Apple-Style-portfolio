export const config = {
  api: {
    bodyParser: {
      sizeLimit: '512kb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, title, subtitle, tags, url } = req.body ?? {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || 'academic-portfolio';
  const filePath = 'src/data/papers.json';

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

  // Read the current papers.json from GitHub
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });

  let papers = [];
  let sha;

  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    papers = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
  } else if (getRes.status !== 404) {
    return res.status(502).json({ error: 'Failed to reach GitHub API' });
  }

  // Derive a stable ID from the title
  const id = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const action = url?.trim() ? { kind: 'link', href: url.trim() } : { kind: 'noop' };
  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const entry = {
    id,
    type: 'item',
    name: title.trim(),
    subtitle: subtitle?.trim() ?? '',
    tags: tagList,
    action,
  };

  const existingIdx = papers.findIndex((p) => p.id === id);
  const verb = existingIdx >= 0 ? 'update' : 'add';
  if (existingIdx >= 0) {
    papers[existingIdx] = entry;
  } else {
    papers.push(entry);
  }

  const updatedContent = Buffer.from(JSON.stringify(papers, null, 2) + '\n').toString('base64');

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `chore: ${verb} paper "${entry.name}"`,
      content: updatedContent,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.message ?? 'GitHub API error' });
  }

  return res.status(200).json({ success: true, action: verb });
}
