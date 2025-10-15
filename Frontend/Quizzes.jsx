/**
 * QuizzesScreen Component
 * 
 * Purpose:
 * This screen allows users to manage and interact with quizzes generated from
 * their text summaries. Users can:
 * - View a list of existing summaries
 * - View content of a selected summary
 * - Generate quiz questions from a summary
 * - Save generated quizzes
 * - View and delete saved quizzes
 * - Navigate to the Flashcard screen to attempt quizzes
 * 
 * Features:
 * - Fetches data from backend APIs for summaries and quizzes
 * - Provides loading indicators for async operations
 * - Supports safe area and scrollable layout
 * - Highlights selected summary
 * 
 * Developed By: Adonyas Kibru
 * Date: 10/15/2025
 * Version: 1.0
 */

import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function Quizzes() {
    const navigation = useNavigation();

    const [summaries, setSummaries] = useState([]);
    const [selectedSummary, setSelectedSummary] = useState(null);
    const [summaryContent, setSummaryContent] = useState('');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(null);

    /** Load username from AsyncStorage */
    useEffect(() => {
        const loadUsername = async () => {
            const storedUsername = await AsyncStorage.getItem('username');
            if (!storedUsername) Alert.alert('Error', 'Username not found. Set it in Settings.');
            else setUsername(storedUsername);
        };
        loadUsername();
    }, []);

    /** Fetch summaries and quizzes when username is available */
    useEffect(() => {
        if (username) {
            fetchSummaries();
            fetchQuizzes();
        }
    }, [username]);

    /** Fetch list of summaries from backend */
    const fetchSummaries = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/summaries-list`);
            const data = await res.json();
            setSummaries(data);
        } catch (err) { console.error(err); }
    };

    /** Fetch list of saved quizzes from backend */
    const fetchQuizzes = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/quizzes-list/${username}`);
            const data = await res.json();
            setQuizzes(data);
        } catch (err) { console.error(err); }
    };

    /** Fetch the content of a selected summary */
    const fetchSummaryContent = async (filename) => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/summaries/${filename}`);
            const text = await res.text();
            setSelectedSummary(filename);
            setSummaryContent(text);
            setQuizQuestions([]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    /** Generate quiz questions from the selected summary */
    const generateQuiz = async () => {
        if (!summaryContent) return Alert.alert('Select a summary first!');
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary: summaryContent, username })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setQuizQuestions(data.questions || []);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to generate quiz questions.');
        } finally { setLoading(false); }
    };

    /** Save the generated quiz to backend */
    const saveQuiz = async () => {
        if (!quizQuestions.length) return;
        const quizName = `${selectedSummary.replace('.txt', '')}-quiz`;
        try {
            const res = await fetch(`${BACKEND_URL}/save-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizName, quizQuestions, username })
            });
            const data = await res.json();
            if (data.success) {
                Alert.alert('Quiz saved!');
                fetchQuizzes();
            }
        } catch (err) { console.error(err); }
    };

    /** Delete a saved quiz */
    const deleteQuiz = async (filename) => {
        try {
            const res = await fetch(`${BACKEND_URL}/delete-quiz/${username}/${filename}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchQuizzes();
        } catch (err) { console.error(err); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Summaries Section */}
                <Text style={styles.sectionTitle}>Summaries</Text>
                {summaries.map((s, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.itemButton, selectedSummary === s && styles.selectedItem]}
                        onPress={() => fetchSummaryContent(s)}
                    >
                        <Text style={styles.buttonText}>{s}</Text>
                    </TouchableOpacity>
                ))}

                {selectedSummary && (
                    <View style={styles.summaryBox}>
                        <ScrollView>
                            <Text style={styles.summaryText}>{summaryContent}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.actionButton} onPress={generateQuiz}>
                            <Text style={styles.actionText}>Generate Quiz</Text>
                        </TouchableOpacity>
                        {quizQuestions.length > 0 && (
                            <TouchableOpacity style={[styles.actionButton, { marginTop: 10 }]} onPress={saveQuiz}>
                                <Text style={styles.actionText}>Save Quiz</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Saved Quizzes Section */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Saved Quizzes</Text>
                {quizzes.map((q, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <TouchableOpacity
                            style={styles.itemButton}
                            onPress={() => navigation.navigate('Flashcard', { quizFile: q })}
                        >
                            <Text style={styles.buttonText}>{q}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteQuiz(q)}>
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {loading && <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#0f0f0f' },
    content: { paddingBottom: 50 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: '#FFF' },
    itemButton: { flex: 1, padding: 12, backgroundColor: '#1E1B4B', borderRadius: 10, marginBottom: 8 },
    selectedItem: { backgroundColor: '#4338CA', borderWidth: 1, borderColor: '#A3E635' },
    buttonText: { color: '#FFF', fontWeight: 'bold' },
    summaryBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: '#A3E635' },
    summaryText: { fontSize: 16, color: '#000', fontFamily: 'monospace', lineHeight: 22, marginBottom: 10 },
    actionButton: { backgroundColor: '#38BDF8', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    actionText: { color: '#FFF', fontWeight: 'bold' },
    deleteButton: { padding: 12, backgroundColor: '#F97316', borderRadius: 10, marginLeft: 5 },
    deleteText: { color: '#FFF', fontWeight: 'bold' },
});
