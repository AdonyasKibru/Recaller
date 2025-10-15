/**
 * SettingsScreen.js
 * 
 * This screen allows users to manage their personal keys and settings.
 * Users can:
 * - Set their username
 * - Input their OpenAI API key
 * - Upload a Google Speech JSON key file
 * - Save their keys to the backend
 * - View and delete existing users
 * 
 * Developed By: Adonyas Kibru
 * Date: 10/15/2025
 * Version: 1.0
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function SettingsScreen() {
    const [username, setUsername] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [speechKeyFile, setSpeechKeyFile] = useState(null);
    const [allUsers, setAllUsers] = useState([]);

    // Load saved username from AsyncStorage and fetch all users
    useEffect(() => {
        const loadStoredUsername = async () => {
            const savedUsername = await AsyncStorage.getItem('username');
            if (savedUsername) setUsername(savedUsername);
        };
        loadStoredUsername();
        fetchUsers();
    }, [username]);

    // Fetch list of all users from backend
    const fetchUsers = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/users-list`);
            const users = await res.json();
            setAllUsers(users);
        } catch (err) {
            console.error('Fetch users error:', err);
        }
    };

    // Pick a Google Speech JSON key file
    const pickSpeechFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSpeechKeyFile(file);
            }
        } catch (err) {
            console.error('File pick error:', err);
            Alert.alert('Error', 'Failed to pick file.');
        }
    };

    // Save username, OpenAI key, and Speech JSON file to backend
    const saveKeys = async () => {
        if (!username) return Alert.alert('Error', 'Username is required.');
        try {
            const formData = new FormData();
            formData.append('username', username);
            if (openaiKey) formData.append('openaiKey', openaiKey);

            if (speechKeyFile) {
                formData.append('speechKey', {
                    uri: speechKeyFile.uri,
                    type: speechKeyFile.mimeType || 'application/json',
                    name: speechKeyFile.name || 'speech-key.json',
                });
            }

            const res = await fetch(`${BACKEND_URL}/save-user-keys`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                Alert.alert('Success', 'Keys saved successfully!');
                await AsyncStorage.setItem('username', username);
            } else {
                Alert.alert('Error', data.error || 'Failed to save keys.');
            }
        } catch (err) {
            console.error('Save keys error:', err);
            Alert.alert('Error', 'Could not save keys.');
        }
    };

    // Delete a user from backend and refresh list
    const deleteUser = (userToDelete) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete "${userToDelete}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${BACKEND_URL}/delete-user/${userToDelete}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (data.success) {
                                Alert.alert('Deleted', `"${userToDelete}" deleted successfully.`);
                                fetchUsers(); // refresh list
                            } else {
                                Alert.alert('Error', data.error || 'Failed to delete user.');
                            }
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to delete user.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.sectionTitle}>Your Keys</Text>

            <Text style={styles.label}>Username:</Text>
            <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>OpenAI API Key:</Text>
            <TextInput
                style={styles.input}
                value={openaiKey}
                onChangeText={setOpenaiKey}
                placeholder="Enter OpenAI API Key"
                placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Google Speech JSON:</Text>
            <TouchableOpacity style={styles.fileButton} onPress={pickSpeechFile}>
                <Text style={styles.fileButtonText}>
                    {speechKeyFile ? speechKeyFile.name : 'Select JSON file'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={saveKeys}>
                <Text style={styles.saveButtonText}>Save Keys</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Existing Users</Text>
            {allUsers.map((user, idx) => (
                <View key={idx} style={styles.userRow}>
                    <Text style={styles.usernameText}>{user}</Text>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteUser(user)}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1E1B4B', padding: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
    label: { color: '#fff', fontSize: 16, marginTop: 15 },
    input: { borderWidth: 1, borderColor: '#fff', borderRadius: 8, padding: 12, color: '#fff', marginTop: 8 },
    fileButton: { marginTop: 12, padding: 12, backgroundColor: '#6C63FF', borderRadius: 8, alignItems: 'center' },
    fileButtonText: { color: '#fff', fontSize: 16 },
    saveButton: { marginTop: 20, padding: 14, backgroundColor: '#4ADE80', borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#1E1B4B', fontWeight: 'bold', fontSize: 16 },
    userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    usernameText: { color: '#fff', fontSize: 16 },
    deleteButton: { padding: 10, backgroundColor: '#F97316', borderRadius: 8, alignItems: 'center' },
    deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
