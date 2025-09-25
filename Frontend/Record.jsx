import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

const BACKEND_URL = 'http://10.0.0.65:5000';

export default function RecordingsList() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [username, setUsername] = useState('');
   
    useEffect(() => {
        loadUsername();
        fetchRecordings();
    }, [recordings]);

    // Load stored username (if you save one in AsyncStorage elsewhere)
    const loadUsername = async () => {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) setUsername(storedUsername);
    };

    // Fetch recordings from backend
    const fetchRecordings = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/recordings-list`);
            const files = await res.json();
            setRecordings(files);
        } catch (err) {
            console.error('[FRONTEND] Fetch recordings error:', err);
        }
    };

    // Pick and upload a .wav file
    const pickAndUpload = async () => {
        try {
            // 1. Pick file
            const result = await DocumentPicker.getDocumentAsync({
                type: ["audio/*"],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets[0];

            // 2. Prepare FormData
            const formData = new FormData();
            formData.append("audio", {
                uri: file.uri,
                type: file.mimeType || "audio/wav",
                name: file.name || "recording.wav",
            });

            // 3. Upload
            const res = await fetch(`${BACKEND_URL}/pick-and-upload`, {
                method: "POST",
                body: formData,
                headers: {
                    "Accept": "application/json",
                },
            });

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Server did not return JSON. Got: " + text);
            }

            if (data.success) {
                Alert.alert("Success", "File uploaded: " + data.filename);
            } else {
                Alert.alert("Error", data.error || "Upload failed");
            }
        } catch (err) {
            console.error("[FRONTEND] Upload error:", err);
            Alert.alert("Error", err.message);
        }
    };

    // Transcribe a file
    const transcribeFile = async (filename) => {
        setLoading(true);
        setSelectedFile(filename);
        setTranscript('');

        try {
            const res = await fetch(`${BACKEND_URL}/transcribe-recording`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, username }),
            });

            const data = await res.json();

            if (data.error) {
                setTranscript(`Error: ${data.error}`);
            } else {
                setTranscript(data.transcript || 'No transcript returned.');
            }
            setModalVisible(true);
        } catch (err) {
            console.error('[FRONTEND] Transcription error:', err);
            setTranscript('Failed to transcribe recording');
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    // Delete a recording
    const deleteRecording = async (filename) => {
        try {
            const res = await fetch(`${BACKEND_URL}/delete-recording/${filename}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                Alert.alert('Deleted', `${filename} removed.`);
                fetchRecordings();
            } else {
                Alert.alert('Error', data.error || 'Failed to delete.');
            }
        } catch (err) {
            console.error('[FRONTEND] Delete error:', err);
        }
    };

    // Render file item
    const renderItem = ({ item }) => (
        <View style={styles.itemRow}>
            <TouchableOpacity
                style={[styles.item, item === selectedFile ? styles.selected : null]}
                onPress={() => transcribeFile(item)}
            >
                <Text style={styles.itemText}>{item}</Text>
            </TouchableOpacity>
            <Pressable
                style={styles.deleteButton}
                onPress={() => deleteRecording(item)}
            >
                <Text style={{ color: '#fff' }}>🗑</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎧 Available Recordings</Text>

            <Pressable style={styles.uploadButton} onPress={pickAndUpload}>
                <Text style={styles.buttonText}>Upload .wav</Text>
            </Pressable>

            <FlatList
                data={recordings}
                renderItem={renderItem}
                keyExtractor={(item) => item}
            />

            {loading && (
                <ActivityIndicator
                    size="large"
                    color="#A3E635"
                    style={{ marginTop: 20 }}
                />
            )}

            {/* Transcript Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>📝 Transcript</Text>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalText}>{transcript}</Text>
                        </ScrollView>

                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f0f',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#F1F5F9',
        marginBottom: 20,
        textAlign: 'center',
    },
    uploadButton: {
        backgroundColor: '#1e90ff',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    item: {
        flex: 1,
        padding: 15,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#4b0082',
    },
    selected: {
        backgroundColor: '#4b0082',
    },
    itemText: {
        color: '#E2E8F0',
        fontSize: 16,
        fontFamily: 'monospace',
    },
    deleteButton: {
        marginLeft: 10,
        backgroundColor: '#ff4444',
        padding: 10,
        borderRadius: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15,15,15,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#A3E635',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#c0c0c0',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalBody: {
        maxHeight: 300,
        marginBottom: 20,
    },
    modalText: {
        fontSize: 16,
        color: '#E2E8F0',
        fontFamily: 'monospace',
        lineHeight: 22,
    },
    saveButton: {
        backgroundColor: '#1e90ff',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    closeButton: {
        backgroundColor: '#4b0082',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
