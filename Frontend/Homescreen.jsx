/**
 * HomeScreen Component
 * 
 * Purpose:
 * This is the main landing page of the Recaller app. It provides users with
 * quick access to the primary features of the app: recording audio, viewing notes,
 * taking quizzes, and adjusting settings.
 * 
 * Features:
 * - Displays a welcoming header with gradient background and app title
 * - Provides four interactive cards for navigation:
 *   1. Choose Audio: Navigate to the audio recording page
 *   2. Notes: Navigate to the user's notes page
 *   3. Quizzes: Navigate to the quizzes page
 *   4. Settings: Navigate to the app settings page
 * - Uses icons from Ionicons and MaterialIcons for visual clarity
 * - Supports safe area insets for proper layout on all devices
 * - Responsive styling with shadows and rounded cards for a modern look
 * 
 * Developed By: Adonyas Kibru
 * Date: 10/15/2025
 * Version: 1.0
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * HomeScreen Function
 * 
 * Displays the main navigation page for the app.
 * Provides interactive cards for navigating to Record, Notes, Quizzes, and Settings screens.
 * 
 * Props:
 * - navigation: object provided by React Navigation for navigating between screens
 * 
 * Returns:
 * - JSX layout for the home page
 */
const HomeScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <LinearGradient colors={['#6C63FF', '#7F56D9']} style={styles.header}>
                <Text style={styles.title}>Welcome to Recaller</Text>
                <Text style={styles.subtitle}>Studying made easy.</Text>
            </LinearGradient>

            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Record')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="mic-outline" size={28} color="white" />
                    <Text style={styles.cardText}>Choose Audio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Notes')}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="note-add" size={28} color="white" />
                    <Text style={styles.cardText}>Notes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Quizzes')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="school-outline" size={28} color="white" />
                    <Text style={styles.cardText}>Quizzes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Settings')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="settings-outline" size={28} color="white" />
                    <Text style={styles.cardText}>Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1E1B4B' },
    header: { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    title: { fontSize: 34, fontWeight: 'bold', color: '#F1F5F9', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#E2E8F0' },
    cardContainer: { flex: 1, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    card: { backgroundColor: '#6C63FF', width: '90%', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
    cardText: { marginTop: 10, fontSize: 20, fontWeight: '600', color: 'white' }
});

export default HomeScreen;
