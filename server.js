/**
 * server.js
 * 
 * Backend server for managing recordings, transcripts, summaries, and quizzes.
 * 
 * Features:
 * 1. RECORDINGS
 *    - Upload recordings
 *    - List recordings
 *    - Delete recordings
 *    - Transcribe recordings using Google Speech
 * 
 * 2. SETTINGS / USERS
 *    - Save user keys (OpenAI, Google Speech)
 *    - Delete users
 *    - List all users
 * 
 * 3. NOTES / TRANSCRIPTS
 *    - List transcripts
 *    - Fetch transcript content
 *    - Summarize transcripts using OpenAI
 *    - Save and delete summaries
 * 
 * 4. QUIZZES
 *    - Generate quizzes from summaries via OpenAI
 *    - Save quizzes per user
 *    - List quizzes
 *    - Fetch specific quiz
 *    - Delete quizzes
 * 
 * Dependencies:
 * - express, fs, path, cors, multer
 * - @google-cloud/speech
 * - openai
 * 
 * Developed By: Adonyas Kibru
 * Date: 10/15/2025
 * Version: 1.0
 */

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

// DELETE /delete-user/:username
app.delete('/delete-user/:username', (req, res) => {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const userFolder = path.join(usersDir, username);

    if (!fs.existsSync(userFolder)) return res.status(404).json({ error: 'User not found' });

    try {
        fs.rmSync(userFolder, { recursive: true, force: true });

        // Optionally, delete quizzes folder if it exists
        const userQuizDir = path.join(__dirname, '../quizzes', username);
        if (fs.existsSync(userQuizDir)) fs.rmSync(userQuizDir, { recursive: true, force: true });

        res.json({ success: true, message: `User ${username} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.get('/users-list', (req, res) => {
    try {
        if (!fs.existsSync(usersDir)) return res.json([]); // no users yet
        const users = fs.readdirSync(usersDir).filter(file => {
            const userPath = path.join(usersDir, file);
            return fs.lstatSync(userPath).isDirectory();
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// ================== NOTES ==================

// List all transcript files
app.get('/transcriptions-list', (req, res) => {
    try {
        const files = fs.readdirSync(transcriptsDir)
            .filter(file => file.endsWith('.txt'));
        res.json(files);
    } catch (err) {
        console.error('[BACKEND] Failed to list transcriptions:', err);
        res.status(500).json({ error: 'Failed to list transcriptions' });
    }
});

// Fetch a specific transcript file
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


// List all saved summaries
app.get('/summaries-list', (req, res) => {
    try {
        const files = fs.readdirSync(summariesDir).filter(file => file.endsWith('.txt'));
        res.json(files);
    } catch (err) {
        console.error('[BACKEND] Failed to list summaries:', err);
        res.status(500).json({ error: 'Failed to list summaries' });
    }
});

// Fetch a specific summary
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

// Delete a summary
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

app.post('/generate-quiz', async (req, res) => {
    const { summary, username } = req.body;

    if (!summary || !username) {
        return res.status(400).json({ error: 'Summary content and username are required' });
    }

    try {
        // Load user's OpenAI key
        const keyPath = path.join(usersDir, username, 'openai-key.txt');
        if (!fs.existsSync(keyPath)) {
            return res.status(400).json({ error: 'OpenAI key not found for this user' });
        }

        const openaiKey = fs.readFileSync(keyPath, 'utf8').trim();
        const openai = new OpenAI({ apiKey: openaiKey });

        // Call OpenAI to generate quiz
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: "system",
                    content: `You are a quiz generator. Respond ONLY with a JSON array of 5 multiple-choice questions. 
            Each question must have: question (string), options (array of strings), answer (string). 
            Do NOT include any extra text.`
                },
                { role: 'user', content: `Generate 5 multiple-choice questions from this text:\n\n${summary}` },
            ],
        });

        const rawContent = completion.choices[0].message?.content?.trim();

        // Try JSON parsing
        let questions;
        try {
            questions = JSON.parse(rawContent);
        } catch (err) {
            console.warn('⚠️ OpenAI returned non-JSON text, using fallback.');
            questions = [{ question: rawContent, options: [], answer: '' }];
        }

        res.json({ questions });

    } catch (err) {
        console.error('[BACKEND] Quiz generation failed:', err);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

// Save a quiz
app.post('/save-quiz', (req, res) => {
    const { quizName, quizQuestions, username } = req.body;
    if (!quizName || !quizQuestions || !username)
        return res.status(400).json({ error: 'Quiz name, questions, and username are required' });

    try {
        const userDir = path.join(usersDir, username, 'quizzes');
        if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

        const filePath = path.join(userDir, `${quizName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(quizQuestions, null, 2), 'utf8');

        res.json({ success: true });
    } catch (err) {
        console.error('[BACKEND] Save quiz error:', err);
        res.status(500).json({ error: 'Failed to save quiz' });
    }
});

// List quizzes
app.get('/quizzes-list/:username', (req, res) => {
    const { username } = req.params;
    const userDir = path.join(usersDir, username, 'quizzes');
    if (!fs.existsSync(userDir)) return res.json([]);

    const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
    res.json(files);
});

// Fetch quiz
app.get('/quizzes/:username/:filename', (req, res) => {
    const { username, filename } = req.params;
    const filePath = path.join(usersDir, username, 'quizzes', filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Quiz not found' });

    const quiz = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(quiz);
});

// Delete quiz
app.delete('/delete-quiz/:username/:filename', (req, res) => {
    const { username, filename } = req.params;
    const filePath = path.join(usersDir, username, 'quizzes', filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Quiz not found' });

    fs.unlinkSync(filePath);
    res.json({ success: true });
});


// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
