import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Alert,
} from 'react-native';

export default function RecordingsList() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        try {
            const response = await fetch('http://10.0.0.65:5000/recordings-list');
            const files = await response.json();
            setRecordings(files);
        } catch (error) {
            console.error('Failed to fetch recordings:', error);
        }
    };

    const transcribeFile = async (filename) => {
        setLoading(true);
        setTranscript('');
        setSelectedFile(filename);

        try {
            const response = await fetch('http://10.0.0.65:5000/transcribe-recording', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename }),
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const data = await response.json();
            setTranscript(data.transcript || 'No transcript returned.');
            setModalVisible(true);
        } catch (error) {
            console.error('Transcription error:', error);
            setTranscript('Failed to transcribe recording');
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const saveTranscriptToServer = async () => {
        try {
            const response = await fetch('http://10.0.0.65:5000/save-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: selectedFile,
                    transcript: transcript,
                }),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Saved', 'Transcript saved to server.');
            } else {
                Alert.alert('Failed', 'Could not save transcript.');
            }
        } catch (err) {
            console.error('Save error:', err);
            Alert.alert('Error', 'An error occurred while saving.');
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
                keyExtractor={(item) => item}
                contentContainerStyle={styles.listContainer}
            />

            {loading && <ActivityIndicator size="large" color="#A3E635" style={{ marginTop: 20 }} />}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
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
    listContainer: {
        paddingBottom: 20,
    },
    item: {
        padding: 15,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#4b0082',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    selected: {
        backgroundColor: '#4b0082',
    },
    itemText: {
        color: '#E2E8F0',
        fontSize: 16,
        fontFamily: 'monospace',
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
        flex: 1,
        marginRight: 10,
    },
    closeButton: {
        backgroundColor: '#4b0082',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
