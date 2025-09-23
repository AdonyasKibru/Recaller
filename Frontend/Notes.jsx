import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/transcriptions-list`);
            const data = await res.json();
            setNotes(data);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        }
    };

    const fetchTranscript = async (filename) => {
        try {
            const res = await fetch(`${BACKEND_URL}/transcripts/${filename}`);
            const text = await res.text();
            setTranscript(text);
        } catch (err) {
            console.error('Error fetching transcript:', err);
            Alert.alert('Error', 'Failed to fetch transcript.');
        }
    };

    const handleNoteSelect = async (filename) => {
        setSelectedNote(filename);
        setSummary('');
        await fetchTranscript(filename);
    };

    const handleSummarize = async () => {
        if (!transcript) return Alert.alert('Error', 'Transcript is empty.');
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/summarize-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript }),
            });
            const data = await res.json();
            if (data.summary) setSummary(data.summary);
            else Alert.alert('Error', data.error || 'Failed to summarize.');
        } catch (err) {
            console.error('Summarization error:', err);
            Alert.alert('Error', 'Failed to summarize transcript.');
        }
        setLoading(false);
    };

    const handleSaveSummary = async () => {
        if (!summary) return Alert.alert('Error', 'Summary is empty.');
        try {
            const res = await fetch(`${BACKEND_URL}/save-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: `summary_${selectedNote}`,
                    transcript: summary,
                }),
            });
            const data = await res.json();
            if (data.success) Alert.alert('Saved', 'Summary saved successfully!');
            else Alert.alert('Error', 'Failed to save summary.');
        } catch (err) {
            console.error('Save error:', err);
            Alert.alert('Error', 'Failed to save summary.');
        }
    };

    const handleBack = () => {
        setSelectedNote(null);
        setTranscript('');
        setSummary('');
    };

    return (
        <LinearGradient colors={['#6C63FF', '#7F56D9']} style={styles.container}>
            {!selectedNote ? (
                <ScrollView contentContainerStyle={styles.notesList}>
                    {notes.map((note, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.noteButton}
                            onPress={() => handleNoteSelect(note)}
                        >
                            <Text style={styles.noteButtonText}>{note}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <ScrollView contentContainerStyle={styles.noteContent}>
                    <Text style={styles.sectionLabel}>Transcript:</Text>
                    <Text style={styles.transcriptText}>{transcript}</Text>

                    <TouchableOpacity style={styles.summarizeButton} onPress={handleSummarize}>
                        <Text style={styles.buttonText}>{loading ? 'Summarizing...' : 'Summarize'}</Text>
                    </TouchableOpacity>

                    {summary ? (
                        <>
                            <Text style={styles.sectionLabel}>Summary:</Text>
                            <Text style={styles.summaryText}>{summary}</Text>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSummary}>
                                <Text style={styles.buttonText}>Save Summary</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}

                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.buttonText}>Back</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    notesList: { alignItems: 'center', paddingBottom: 40 },
    noteButton: {
        backgroundColor: '#1E1B4B',
        width: '85%',
        paddingVertical: 20,
        borderRadius: 15,
        marginVertical: 10,
        alignItems: 'center',
    },
    noteButtonText: { color: '#FFF', fontSize: 18 },
    noteContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionLabel: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 20 },
    transcriptText: {
        fontSize: 16,
        color: '#DDD',
        marginTop: 10,
        fontFamily: 'monospace',
        lineHeight: 22,
    },
    summaryText: {
        fontSize: 16,
        color: '#A3E635',
        marginTop: 10,
        fontFamily: 'monospace',
        lineHeight: 22,
    },
    summarizeButton: {
        backgroundColor: '#38BDF8',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#4ADE80',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    backButton: {
        backgroundColor: '#F87171',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
