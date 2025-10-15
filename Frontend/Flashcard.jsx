/**
 * Flashcard Page Component
 * 
 * Purpose:
 * This component displays quiz questions in a flashcard-style interface.
 * Users can flip each card to view the correct answer and navigate between questions.
 * The quiz data is fetched dynamically from the backend using the logged-in user's username.
 * 
 * Features:
 * - Fetches quiz JSON for the current user from the backend
 * - Displays question text along with multiple-choice options
 * - Allows flipping the card to reveal the correct answer
 * - Navigation between previous and next questions
 * - Handles embedded JSON strings returned by backend
 * - Shows loading indicator while fetching data
 * - Displays a message if no questions are found
 * 
 * Developed By: Adonyas Kibru
 * Date: 10/15/2025
 * Version: 1.0
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function Flashcard({ route }) {
    const { quizFile } = route.params;

    const [quiz, setQuiz] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(null);

    /**
     * Load stored username from AsyncStorage
     * Needed to fetch user-specific quizzes from backend
     */
    useEffect(() => {
        const loadUsername = async () => {
            const storedUsername = await AsyncStorage.getItem('username');
            if (!storedUsername) Alert.alert('Error', 'Username not found. Set it in Settings.');
            else setUsername(storedUsername);
        };
        loadUsername();
    }, []);

    /**
     * Fetch quiz questions from backend
     * Handles special case when quiz JSON is embedded inside a string
     */
    useEffect(() => {
        if (!username) return;

        const fetchQuiz = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/quizzes/${username}/${quizFile}`);
                let data = await res.json();

                // this is because the returned json is a string json and needs proper formatting to be used.
                if (data.length === 1 && data[0].question.startsWith('```json')) {
                    const raw = data[0].question
                        .replace(/```json/g, '')
                        .replace(/```/g, '')
                        .trim();
                    data = JSON.parse(raw);
                }

                setQuiz(data);
            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to load quiz.');
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [username]);

    if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1 }} />;

    if (!quiz.length) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#FFF', fontSize: 18 }}>No questions found.</Text>
        </View>
    );

    const question = quiz[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 15 }}>
                {/* Flashcard displaying question and options */}
                <View style={styles.card}>
                    <Text style={styles.cardText}>{question.question}</Text>

                    {!showAnswer && question.options && (
                        <View style={{ marginTop: 10 }}>
                            {question.options.map((opt, i) => (
                                <Text key={i} style={styles.optionText}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                </Text>
                            ))}
                        </View>
                    )}

                    {showAnswer && (
                        <Text style={[styles.optionText, { color: '#A3E635', marginTop: 15, fontStyle: 'italic' }]}>
                            Correct Answer: {question.answer}
                        </Text>
                    )}
                </View>

                {/* Button to flip between question and answer */}
                <TouchableOpacity style={styles.flipButton} onPress={() => setShowAnswer(!showAnswer)}>
                    <Text style={styles.buttonText}>{showAnswer ? 'Show Question' : 'Show Answer'}</Text>
                </TouchableOpacity>

                {/* Navigation buttons for previous/next question */}
                <View style={styles.navRow}>
                    <TouchableOpacity
                        onPress={() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setShowAnswer(false); } }}
                    >
                        <Text style={styles.navText}>Previous</Text>
                    </TouchableOpacity>

                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                        {currentIndex + 1} / {quiz.length}
                    </Text>

                    <TouchableOpacity
                        onPress={() => { if (currentIndex < quiz.length - 1) { setCurrentIndex(currentIndex + 1); setShowAnswer(false); } }}
                    >
                        <Text style={styles.navText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f' },
    card: {
        backgroundColor: '#1E1B4B',
        padding: 20,
        borderRadius: 15,
        minHeight: 180,
        justifyContent: 'center',
        marginBottom: 15,
    },
    cardText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    optionText: { color: '#FFF', fontSize: 16, marginTop: 5, marginLeft: 10 },
    flipButton: { marginTop: 15, backgroundColor: '#38BDF8', padding: 12, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#FFF', fontWeight: 'bold' },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    navText: { color: '#A3E635', fontWeight: 'bold', fontSize: 16 },
});
