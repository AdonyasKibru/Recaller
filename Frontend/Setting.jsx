import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function SettingsScreen() {
    const [username, setUsername] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [speechKeyFile, setSpeechKeyFile] = useState(null);

    useEffect(() => {
        const loadStoredUsername = async () => {
            const savedUsername = await AsyncStorage.getItem('username');
            if (savedUsername) setUsername(savedUsername);
        };
        loadStoredUsername();
    }, []);

    const pickSpeechFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
            console.log("[FRONTEND] DocumentPicker result:", result);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSpeechKeyFile(file);
                console.log("[FRONTEND] Selected file:", file.name, file.uri);
            }
        } catch (err) {
            console.error("[FRONTEND] File pick error:", err);
        }
    };

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

            const res = await fetch(`${BACKEND_URL}/save-user-keys`, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type manually
            });

            const data = await res.json();
            if (data.success) {
                Alert.alert('Success', 'Keys saved successfully!');
                await AsyncStorage.setItem('username', username);
            } else {
                Alert.alert('Error', data.error || 'Failed to save keys.');
            }
        } catch (err) {
            console.error('[FRONTEND] Save keys error:', err);
            Alert.alert('Error', 'Could not save keys.');
        }
    };

    return (
        <View style={styles.container}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1E1B4B', padding: 20 },
    label: { color: '#fff', fontSize: 16, marginTop: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        marginTop: 8,
    },
    fileButton: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#6C63FF',
        borderRadius: 8,
        alignItems: 'center',
    },
    fileButtonText: { color: '#fff', fontSize: 16 },
    saveButton: {
        marginTop: 20,
        padding: 14,
        backgroundColor: '#4ADE80',
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: { color: '#1E1B4B', fontWeight: 'bold', fontSize: 16 },
});
