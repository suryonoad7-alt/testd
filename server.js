const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '20mb' }));

app.post('/upload-data', (req, res) => {
  const { image, location } = req.body;
  if (!image || !location) {
    return res.status(400).json({ error: 'Missing image or location data' });
  }

  const match = image.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid image format' });
  }

  const buffer = Buffer.from(match[2], 'base64');
  const timestamp = Date.now();
  const imageFile = path.join(uploadDir, `capture-${timestamp}.jpg`);
  const metaFile = path.join(uploadDir, `capture-${timestamp}-meta.json`);

  fs.writeFileSync(imageFile, buffer);
  fs.writeFileSync(metaFile, JSON.stringify({ timestamp: new Date().toISOString(), imageFile: path.basename(imageFile), location }, null, 2));

  res.json({ success: true, imageFile: `/uploads/${path.basename(imageFile)}` });
});

app.get('/api/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const metas = files
      .filter((file) => file.endsWith('-meta.json'))
      .map((metaFile) => {
        const metaPath = path.join(uploadDir, metaFile);
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return {
          ...meta,
          imageUrl: `/uploads/${meta.imageFile}`,
          metaFile,
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json({ success: true, data: metas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/latest', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const metas = files
      .filter((file) => file.endsWith('-meta.json'))
      .map((metaFile) => {
        const metaPath = path.join(uploadDir, metaFile);
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return {
          ...meta,
          imageUrl: `/uploads/${meta.imageFile}`,
          metaFile,
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const latest = metas[0] || null;
    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'results.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
