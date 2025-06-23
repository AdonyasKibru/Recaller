const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const speech = require('@google-cloud/speech');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const client = new speech.SpeechClient({ keyFilename: './speech-key.json' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const recordingsDir = path.join(__dirname, 'recordings');
const transcriptionsDir = path.join(__dirname, 'transcripts');

// GET list of all .wav recordings
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

// Transcribe a specific .wav file by name
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
        console.error('[BACKEND] Transcription error:', err);
        res.status(500).json({ error: 'Transcription failed' });
    }
});

// Save a transcript or summary to a .txt file
app.post('/save-transcript', express.json(), (req, res) => {
    const { filename, transcript } = req.body;

    if (!filename || !transcript) {
        return res.status(400).json({ error: 'Missing filename or transcript' });
    }

    const safeFilename = path.basename(filename).replace(/\.[^/.]+$/, '');
    const outputPath = path.join(transcriptionsDir, `${safeFilename}.txt`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, transcript, 'utf8');

    console.log(`[BACKEND] Transcript saved: ${outputPath}`);
    res.json({ success: true, path: outputPath });
});

// List all saved transcripts (.txt files)
app.get('/transcriptions-list', (req, res) => {
    fs.readdir(transcriptionsDir, (err, files) => {
        if (err) {
            console.error('Failed to read transcripts folder:', err);
            return res.status(500).json({ error: 'Failed to read transcripts' });
        }

        const textFiles = files.filter(file => file.toLowerCase().endsWith('.txt'));
        res.json(textFiles);
    });
});

// Serve a specific transcript text file
app.get('/transcripts/:filename', (req, res) => {
    const filePath = path.join(transcriptionsDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Transcript not found');
    }
    res.sendFile(filePath);
});

// Summarize a transcript using OpenAI
app.post('/summarize-transcript', async (req, res) => {
    const { transcript } = req.body;

    if (!transcript) {
        return res.status(400).json({ error: 'Transcript required' });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Or "gpt-3.5-turbo"
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that summarizes transcripts into clean notes.",
                },
                {
                    role: "user",
                    content: `Here is a transcript:\n\n${transcript}\n\nSummarize this into bullet-point notes.`,
                },
            ],
        });

        const summary = completion.choices[0].message.content;
        res.json({ summary });
    } catch (err) {
        console.error('[BACKEND] OpenAI summarization error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to summarize transcript' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
