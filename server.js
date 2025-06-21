const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const speech = require('@google-cloud/speech');

const app = express();
const client = new speech.SpeechClient({ keyFilename: './speech-key.json' });

app.use(cors());
app.use(express.json());

const recordingsDir = path.join(__dirname, 'recordings');

// ✅ GET list of all .wav recordings
app.get('/recordings-list', (req, res) => {
  fs.readdir(recordingsDir, (err, files) => {
    if (err) {
      console.error('Failed to read recordings folder:', err);
      return res.status(500).json({ error: 'Failed to read recordings' });
    }

    const wavFiles = files.filter(file => file.toLowerCase().endsWith('.wav'));
    res.json(wavFiles);
  });
});

// ✅ Transcribe a specific .wav file by name
app.post('/transcribe-recording', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename required' });

    const filePath = path.join(recordingsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const fileBytes = fs.readFileSync(filePath);
    const audioBytes = fileBytes.toString('base64');

    const audio = { content: audioBytes };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 44100,
      languageCode: 'en-US',
    };

    const [operation] = await client.longRunningRecognize({ audio, config });
    const [response] = await operation.promise();

    const transcript = response.results.map(r => r.alternatives[0].transcript).join('\n');
    res.json({ transcript });
  } catch (err) {
    console.error('[❌ BACKEND] Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/save-transcript', express.json(), (req, res) => {
  const { filename, transcript } = req.body;

  if (!filename || !transcript) {
    return res.status(400).json({ error: 'Missing filename or transcript' });
  }

  const safeFilename = path.basename(filename).replace(/\.[^/.]+$/, '');
  const outputPath = path.join(__dirname, 'transcripts', `${safeFilename}.txt`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, transcript, 'utf8');

  console.log(`[💾 BACKEND] Transcript saved: ${outputPath}`);
  res.json({ success: true, path: outputPath });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
