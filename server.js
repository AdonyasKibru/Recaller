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
[recordingsDir, transcriptsDir, usersDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});
const summariesDir = path.join(__dirname, 'summaries');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, recordingsDir),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ================== RECORDINGS ==================

// List recordings
app.get('/recordings-list', (req, res) => {
    try {
        const files = fs.readdirSync(recordingsDir);
        res.json(files);
    } catch (err) {
        console.error('[BACKEND] Failed to read recordings:', err);
        res.status(500).json({ error: 'Failed to load recordings' });
    }
});

// Route for uploading picked audio
app.post("/pick-and-upload", upload.single("audio"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }
        res.json({ success: true, filename: req.file.filename });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Delete recording
app.delete('/delete-recording/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(recordingsDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: `Deleted ${filename}` });
    } catch (err) {
        console.error('[BACKEND] Delete error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Transcribe recording with Google Speech
app.post('/transcribe-recording', async (req, res) => {
    const { filename, username } = req.body;
    if (!filename || !username) return res.status(400).json({ error: 'Filename and username required' });

    const userFolder = path.join(usersDir, username);
    const speechKeyPath = path.join(userFolder, 'speech-key.json');
    if (!fs.existsSync(speechKeyPath)) {
        return res.status(400).json({ error: 'User Google Speech key not found' });
    }

    const filePath = path.join(recordingsDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Audio file not found' });
    }

    try {
        const client = new SpeechClient({ keyFilename: speechKeyPath });
        const audioBytes = fs.readFileSync(filePath).toString('base64');

        const [operation] = await client.longRunningRecognize({
            audio: { content: audioBytes },
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 44100,
                languageCode: 'en-US',
            },
        });

        const [response] = await operation.promise();
        const transcript = response.results.map(r => r.alternatives[0].transcript).join('\n');

        // Save transcript with .txt extension in transcripts/
        const transcriptName = `${path.parse(filename).name}_${username}.txt`;
        fs.writeFileSync(path.join(transcriptsDir, transcriptName), transcript, 'utf8');

        res.json({ success: true, transcript, file: transcriptName });
    } catch (err) {
        console.error('[BACKEND] Transcription error:', err);
        res.status(500).json({ error: 'Failed to transcribe recording' });
    }
});

// ================== SETTING ==================

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
    }

    res.json({ success: true, message: 'Keys saved successfully' });
});

// ================== NOTES ==================

// 1. List all transcript files
app.get('/transcriptions-list', (req, res) => {
    try {
        const files = fs.readdirSync(transcriptsDir)
            .filter(file => file.endsWith('.txt')); // only .txt transcripts
        res.json(files);
    } catch (err) {
        console.error('[BACKEND] Failed to list transcriptions:', err);
        res.status(500).json({ error: 'Failed to list transcriptions' });
    }
});

// 2. Fetch a specific transcript file
app.get('/transcripts/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(transcriptsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Transcript not found');
        }

        const transcript = fs.readFileSync(filePath, 'utf8');
        res.send(transcript);
    } catch (err) {
        console.error('[BACKEND] Failed to fetch transcript:', err);
        res.status(500).send('Failed to fetch transcript');
    }
});

// Summarize transcript with OpenAI
app.post('/summarize-transcript', async (req, res) => {
    const { transcript, username } = req.body;

    if (!transcript || !username)
        return res.status(400).json({ error: 'Transcript and username required' });

    try {
        const keyPath = path.join(usersDir, username, 'openai-key.txt');

        if (!fs.existsSync(keyPath))
            return res.status(400).json({ error: 'OpenAI key not found for this user' });

        const openaiKey = fs.readFileSync(keyPath, 'utf8').trim();

        const openai = new OpenAI({ apiKey: openaiKey });

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system', content: `You are an expert note-taking assistant. 
                      Summarize transcripts into **well-organized, readable notes**. 
                      Use bullet points, headings, and examples if needed. 
                      Provide clear explanations of the content for easier understanding.` },
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

app.post('/save-summary', (req, res) => {
    const { filename, summary } = req.body;
    if (!filename || !summary) {
        return res.status(400).json({ success: false, error: 'Filename and summary required' });
    }

    try {
        const filePath = path.join(summariesDir, filename);
        fs.writeFileSync(filePath, summary, 'utf8');
        res.json({ success: true, message: `Summary saved as ${filename}` });
    } catch (err) {
        console.error('[BACKEND] Failed to save summary:', err);
        res.status(500).json({ success: false, error: 'Failed to save summary' });
    }
});

// Delete transcript
app.delete('/delete-transcript/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(transcriptsDir, filename);

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Transcript not found' });

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: `Deleted ${filename}` });
    } catch (err) {
        console.error('[BACKEND] Delete error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete transcript' });
    }
});


// 1️⃣ List all saved summaries
app.get('/summaries-list', (req, res) => {
    try {
        const files = fs.readdirSync(summariesDir).filter(file => file.endsWith('.txt'));
        res.json(files);
    } catch (err) {
        console.error('[BACKEND] Failed to list summaries:', err);
        res.status(500).json({ error: 'Failed to list summaries' });
    }
});

// 2️⃣ Fetch a specific summary
app.get('/summaries/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(summariesDir, filename);

        if (!fs.existsSync(filePath)) return res.status(404).send('Summary not found');

        const summary = fs.readFileSync(filePath, 'utf8');
        res.send(summary);
    } catch (err) {
        console.error('[BACKEND] Failed to fetch summary:', err);
        res.status(500).send('Failed to fetch summary');
    }
});

// 3️⃣ Delete a summary
app.delete('/delete-summary/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(summariesDir, filename);

    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Summary not found' });

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: `Deleted summary ${filename}` });
    } catch (err) {
        console.error('[BACKEND] Delete summary error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete summary' });
    }
});


// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
