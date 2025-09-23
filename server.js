const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Directories
const recordingsDir = path.join(__dirname, 'recordings');
const transcriptsDir = path.join(__dirname, 'transcripts');
const usersDir = path.join(__dirname, 'users');
[recordingsDir, transcriptsDir, usersDir].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir); });

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, recordingsDir),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Save user keys
app.post('/save-user-keys', upload.single('speechKey'), (req, res) => {
    const { username, openaiKey } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const userFolder = path.join(usersDir, username);
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder);

    // Save OpenAI key
    if (openaiKey) fs.writeFileSync(path.join(userFolder, 'openai-key.txt'), openaiKey, 'utf8');

    // Save Google Speech JSON key
    if (req.file) {
        const destPath = path.join(userFolder, 'speech-key.json');
        fs.renameSync(req.file.path, destPath);
        console.log('[BACKEND] Speech key saved at:', destPath);
    }

    res.json({ success: true, message: 'Keys saved successfully' });
});

// Transcribe recording
app.post('/transcribe-recording', async (req, res) => {
    const { filename, username } = req.body;
    if (!filename || !username) return res.status(400).json({ error: 'Filename and username required' });

    const userFolder = path.join(usersDir, username);
    const speechKeyPath = path.join(userFolder, 'speech-key.json');
    if (!fs.existsSync(speechKeyPath)) return res.status(400).json({ error: 'User Google Speech key not found' });

    const filePath = path.join(recordingsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Audio file not found' });

    try {
        const client = new SpeechClient({ keyFilename: speechKeyPath });
        const audioBytes = fs.readFileSync(filePath).toString('base64');

        const [operation] = await client.longRunningRecognize({
            audio: { content: audioBytes },
            config: { encoding: 'LINEAR16', sampleRateHertz: 44100, languageCode: 'en-US' },
        });

        const [response] = await operation.promise();
        const transcript = response.results.map(r => r.alternatives[0].transcript).join('\n');

        // Save transcript
        fs.writeFileSync(path.join(transcriptsDir, `${filename}.txt`), transcript, 'utf8');

        res.json({ transcript });
    } catch (err) {
        console.error('[BACKEND] Transcription error:', err);
        res.status(500).json({ error: 'Failed to transcribe recording' });
    }
});

app.post('/summarize-transcript', async (req, res) => {
    const { transcript, username } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    try {
        let openaiKey = process.env.OPENAI_API_KEY;
        console.log('[BACKEND] Initial OpenAI key from env:', openaiKey);

        if (username) {
            const keyPath = path.join(usersDir, username, 'openai-Key.txt');
            console.log('[BACKEND] Looking for user key at:', keyPath);

            if (fs.existsSync(keyPath)) {
                openaiKey = fs.readFileSync(keyPath, 'utf8').trim();
                console.log('[BACKEND] User-specific OpenAI key loaded:', openaiKey ? 'YES' : 'EMPTY');
            } else {
                console.log('[BACKEND] User key file not found');
            }
        }

        if (!openaiKey) return res.status(400).json({ error: 'OpenAI key not found' });

        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Summarize transcripts into short readable notes.' },
                { role: 'user', content: transcript },
            ],
        });

        const summary = completion.choices[0].message.content;
        res.json({ summary });
    } catch (err) {
        console.error('[BACKEND] Summarization error:', err);
        res.status(500).json({ error: 'Failed to summarize transcript' });
    }
});


app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
