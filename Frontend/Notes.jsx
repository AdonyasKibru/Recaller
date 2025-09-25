import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function Notes() {
    const [username, setUsername] = useState(null);
    const [transcripts, setTranscripts] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeSummary, setActiveSummary] = useState(null);
    const [summaryContent, setSummaryContent] = useState('');

    // Load username
    useEffect(() => {
        const loadUsername = async () => {
            const storedUsername = await AsyncStorage.getItem('username');
            if (!storedUsername) Alert.alert('Error', 'Username not found. Set it in Settings.');
            else setUsername(storedUsername);
        };
        loadUsername();
    }, []);

    // Fetch transcripts & summaries
    useEffect(() => {
        fetchTranscripts();
        fetchSummaries();
    }, []);

    const fetchTranscripts = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/transcriptions-list`);
            const data = await res.json();
            setTranscripts(data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch transcripts.');
        }
    };

    const fetchSummaries = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/summaries-list`);
            const data = await res.json();
            setSummaries(data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch summaries.');
        }
    };

    // Delete transcript
    const deleteTranscript = async (filename) => {
        Alert.alert('Confirm', `Delete transcript "${filename}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        const res = await fetch(`${BACKEND_URL}/delete-transcript/${filename}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (data.success) {
                            Alert.alert('Deleted', filename);
                            fetchTranscripts();
                        }
                    } catch (err) {
                        console.error(err);
                        Alert.alert('Error', 'Failed to delete transcript');
                    }
                }
            }
        ]);
    };

    // Summarize transcript and save
    const handleSummarize = async (filename) => {
        if (!username) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/transcripts/${filename}`);
            const transcript = await res.text();

            const sumRes = await fetch(`${BACKEND_URL}/summarize-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, username })
            });
            const sumData = await sumRes.json();
            if (sumData.error) throw new Error(sumData.error);

            const summary = sumData.summary;

            const saveRes = await fetch(`${BACKEND_URL}/save-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: `summary_${filename}`, summary })
            });
            const saveData = await saveRes.json();
            if (!saveData.success) throw new Error('Failed to save summary');

            Alert.alert('Success', `Summary created for ${filename}`);
            fetchSummaries();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to summarize');
        }
        setLoading(false);
    };

    // Show summary content
    const openSummary = async (filename) => {
        try {
            const res = await fetch(`${BACKEND_URL}/summaries/${filename}`);
            const text = await res.text();
            setActiveSummary(filename);
            setSummaryContent(text);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch summary');
        }
    };

    // Delete summary
    const deleteSummary = async (filename) => {
        Alert.alert('Confirm', `Delete summary "${filename}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        const res = await fetch(`${BACKEND_URL}/delete-summary/${filename}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (data.success) {
                            Alert.alert('Deleted', filename);
                            setActiveSummary(null);
                            fetchSummaries();
                        }
                    } catch (err) {
                        console.error(err);
                        Alert.alert('Error', 'Failed to delete summary');
                    }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Transcripts</Text>
                {transcripts.map((t, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <TouchableOpacity style={styles.itemButton} onPress={() => handleSummarize(t)}>
                            <Text style={styles.buttonText}>{t}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTranscript(t)}>
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Summaries</Text>
                {summaries.map((s, idx) => (
                    <View key={idx}>
                        <TouchableOpacity style={styles.itemButton} onPress={() => openSummary(s)}>
                            <Text style={styles.buttonText}>{s}</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {activeSummary && (
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryTitle}>{activeSummary}</Text>
                        <ScrollView style={{ flexGrow: 1 }}>
                            <Text style={styles.summaryText}>{summaryContent}</Text>
                        </ScrollView>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => deleteSummary(activeSummary)}>
                                <Text style={styles.actionText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveSummary(null)}>
                                <Text style={styles.actionText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {loading && <ActivityIndicator size="large" color="#6C63FF" />}
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#0f0f0f', // dark background
    },
    content: { paddingBottom: 50 },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#FFF', // white for headings
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    itemButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#1E1B4B', // deep purple-blue
        borderRadius: 10,
        marginRight: 5,
    },
    deleteButton: {
        padding: 12,
        backgroundColor: '#F97316', // orange for delete
        borderRadius: 10,
    },
    buttonText: { color: '#FFF', fontWeight: 'bold' },
    deleteText: { color: '#FFF', fontWeight: 'bold' },
    divider: { height: 2, backgroundColor: '#555', marginVertical: 15 },
    summaryBox: {
        backgroundColor: '#FFF', // white background for summary
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#A3E635', // bright green border
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000', // black title text
    },
    summaryText: {
        fontSize: 16,
        color: '#000', // black summary text
        fontFamily: 'monospace',
        lineHeight: 22,
    },
    buttonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    actionButton: {
        backgroundColor: '#38BDF8', // cyan button for actions
        padding: 10,
        borderRadius: 10,
        flex: 1,
        alignItems: 'center',
    },
    actionText: { color: '#FFF', fontWeight: 'bold' },
    loadingIndicator: { marginTop: 20 },
});

