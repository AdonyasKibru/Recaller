import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BACKEND_URL = 'http://10.0.0.65:5000';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${BACKEND_URL}/transcriptions-list`)
            .then(res => res.json())
            .then(setNotes)
            .catch(err => console.error('Failed to fetch notes:', err));
    }, []);

    const fetchTranscriptText = async (filename) => {
        try {
            const res = await fetch(`${BACKEND_URL}/transcripts/${filename}`);
            const text = await res.text();
            setTranscript(text);
        } catch (err) {
            console.error('Error fetching transcript:', err);
        }
    };

    const handleNoteSelect = async (filename) => {
        setSelectedNote(filename);
        setSummary('');
        await fetchTranscriptText(filename);
    };

    const handleSummarize = async () => {
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
            console.error('Summarization failed:', err);
            Alert.alert('Error', 'Failed to summarize.');
        }
        setLoading(false);
    };

    const handleSaveSummary = async () => {
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
            console.error('Save failed:', err);
            Alert.alert('Error', 'Save request failed.');
        }
    };

    const reset = () => {
        setSelectedNote(null);
        setTranscript('');
        setSummary('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#6C63FF', '#7F56D9']} style={styles.header}>
                {!selectedNote ? (
                    <ScrollView contentContainerStyle={styles.buttonContainer}>
                        {notes.map((note, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.noteButton}
                                onPress={() => handleNoteSelect(note)}
                            >
                                <Text style={styles.buttonText}>Note {index + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <ScrollView contentContainerStyle={styles.noteView}>
                        <Text style={styles.label}>Transcript:</Text>
                        <Text style={styles.noteText}>{transcript}</Text>

                        <TouchableOpacity style={styles.buttonAction} onPress={handleSummarize}>
                            <Text style={styles.buttonText}>{loading ? 'Summarizing...' : 'Summarize'}</Text>
                        </TouchableOpacity>

                        {summary !== '' && (
                            <>
                                <Text style={styles.label}>Summary:</Text>
                                <Text style={styles.summaryText}>{summary}</Text>
                                <TouchableOpacity style={styles.buttonSave} onPress={handleSaveSummary}>
                                    <Text style={styles.buttonText}>Save Summary</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity style={styles.buttonBack} onPress={reset}>
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </LinearGradient>
        </SafeAreaView>
    );
};

export default Notes;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: '100%',
        width: '100%',
        paddingTop: 50,
    },
    buttonContainer: {
        alignItems: 'center',
        paddingBottom: 100,
        paddingHorizontal: 20,
    },
    noteButton: {
        backgroundColor: '#1E1B4B',
        width: '80%',
        paddingVertical: 25,
        borderRadius: 15,
        marginVertical: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
    noteView: {
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        color: 'white',
    },
    noteText: {
        marginTop: 10,
        fontSize: 16,
        color: '#DDD',
        fontFamily: 'monospace',
    },
    summaryText: {
        marginTop: 10,
        fontSize: 16,
        color: '#A3E635',
        fontFamily: 'monospace',
    },
    buttonAction: {
        backgroundColor: '#38BDF8',
        marginTop: 20,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonSave: {
        backgroundColor: '#4ADE80',
        marginTop: 20,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonBack: {
        backgroundColor: '#F87171',
        marginTop: 30,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
});
