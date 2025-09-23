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
    }, []);

    const loadUsername = async () => {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) setUsername(storedUsername);
        console.log('[FRONTEND] Username from AsyncStorage:', storedUsername);
    };

    const fetchRecordings = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/recordings-list`);
            const files = await res.json();
            setRecordings(files);
        } catch (err) {
            console.error('[FRONTEND] Failed to fetch recordings:', err);
        }
    };

    const transcribeFile = async (filename) => {
        setLoading(true);
        setSelectedFile(filename);
        setTranscript('');

        try {
            console.log('[FRONTEND] Sending request to backend for transcription of:', filename);
            const res = await fetch(`${BACKEND_URL}/transcribe-recording`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, username }),
            });

            console.log('[FRONTEND] Response status:', res.status);
            const data = await res.json();
            console.log('[FRONTEND] Response data:', data);

            setTranscript(data.transcript || 'No transcript returned.');
            setModalVisible(true);
        } catch (err) {
            console.error('[FRONTEND] Transcription error:', err);
            setTranscript('Failed to transcribe recording');
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const saveTranscriptToServer = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/save-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: selectedFile, transcript }),
            });
            const data = await res.json();
            Alert.alert(data.success ? 'Saved' : 'Failed', data.success ? 'Transcript saved.' : 'Could not save transcript.');
        } catch (err) {
            console.error('[FRONTEND] Save transcript error:', err);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.item, item === selectedFile ? styles.selected : null]}
            onPress={() => transcribeFile(item)}
        >
            <Text style={styles.itemText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎧 Available Recordings</Text>

            <FlatList
                data={recordings}
                renderItem={renderItem}
                keyExtractor={item => item}
            />

            {loading && <ActivityIndicator size="large" color="#A3E635" style={{ marginTop: 20 }} />}

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>📝 Transcript</Text>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalText}>{transcript}</Text>
                        </ScrollView>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Pressable style={styles.saveButton} onPress={saveTranscriptToServer}>
                                <Text style={styles.buttonText}>Save</Text>
                            </Pressable>

                            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f0f', paddingTop: 60, paddingHorizontal: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#F1F5F9', marginBottom: 20, textAlign: 'center' },
    item: { padding: 15, backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#4b0082', marginBottom: 12 },
    selected: { backgroundColor: '#4b0082' },
    itemText: { color: '#E2E8F0', fontSize: 16, fontFamily: 'monospace' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,15,15,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', maxHeight: '80%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#A3E635' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#c0c0c0', marginBottom: 10, textAlign: 'center' },
    modalBody: { maxHeight: 300, marginBottom: 20 },
    modalText: { fontSize: 16, color: '#E2E8F0', fontFamily: 'monospace', lineHeight: 22 },
    saveButton: { backgroundColor: '#1e90ff', paddingVertical: 10, borderRadius: 10, alignItems: 'center', flex: 1, marginRight: 10 },
    closeButton: { backgroundColor: '#4b0082', paddingVertical: 10, borderRadius: 10, alignItems: 'center', flex: 1, marginLeft: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
