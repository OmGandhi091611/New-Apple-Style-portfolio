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

  const { password, caption, fileBase64, fileName } = req.body ?? {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!fileBase64 || !fileName) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return res.status(500).json({ error: 'Server misconfigured — missing GitHub env vars' });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'om-portfolio-photo-uploader',
  };

  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const slugBase =
    (caption?.trim() || 'photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';
  const uniqueName = `${slugBase}-${Date.now()}.${ext}`;
  const imagePath = `public/photos/${uniqueName}`;

  // 1) Upload the image file
  const imageApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${imagePath}`;
  const imagePutRes = await fetch(imageApiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `chore: add photo "${uniqueName}"`,
      content: fileBase64,
    }),
  });

  if (!imagePutRes.ok) {
    const err = await imagePutRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.message ?? 'GitHub API error uploading image' });
  }

  // 2) Append an entry to src/data/photos.json
  const dataPath = 'src/data/photos.json';
  const dataApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}`;

  const getRes = await fetch(dataApiUrl, { headers });
  let photos = [];
  let sha;

  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    photos = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
  } else if (getRes.status !== 404) {
    return res.status(502).json({ error: 'Failed to reach GitHub API' });
  }

  photos.push({
    id: uniqueName.replace(/\.[^.]+$/, ''),
    src: `/photos/${uniqueName}`,
    caption: caption?.trim() ?? '',
  });

  const updatedContent = Buffer.from(JSON.stringify(photos, null, 2) + '\n').toString('base64');

  const dataPutRes = await fetch(dataApiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `chore: add photo entry "${uniqueName}"`,
      content: updatedContent,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!dataPutRes.ok) {
    const err = await dataPutRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.message ?? 'GitHub API error updating photos.json' });
  }

  return res.status(200).json({ success: true });
}
