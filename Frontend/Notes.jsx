import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


const note1 = "This is the note I like to show1";
const note2 = "This is the note I like to show2";
const note3 = "This is the note I like to show3";


const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [message, setMessage] = useState();
    const [page, setPage] = useState(0);


    useEffect(() => {
        setNotes([note1, note2, note3]);


    }, [page]);


    const showMessage = (index) => {
        setMessage(notes[index]);
        setPage(index + 1);
    };


    const handleBack = () => {
        setPage(0);
    }
    return (
        <>
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#6C63FF', '#7F56D9']}
                    style={styles.header}
                >
                    {page === 0 ?
                        <View style={styles.buttonContainer}>
                            {notes.map((note, index) => (
                                <TouchableOpacity key={index} style={styles.noteButton} onPress={() => showMessage(index)}>
                                    <Text style={styles.buttonText}>Note {index + 1}</Text>
                                </TouchableOpacity>
                            ))
                            }
                        </View>
                        :
                        <View style={styles.backContainer}>
                            <View style={styles.noteContainer}>
                                <Text style={styles.noteText}>{message}</Text>
                            </View>


                            <TouchableOpacity style={styles.buttonBack} onPress={handleBack}>
                                <Text style={styles.buttonText}>Back</Text>
                            </TouchableOpacity>
                        </View>
                    }
                </LinearGradient>
            </SafeAreaView>
        </>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        height: '100%',
        width: '100%'
    },
    noteContainer: {
        position: 'absolute',
        top: 40,
        alignSelf: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#4b0082',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6,
    },
    noteText: {
        color: '#c0c0c0',
        fontSize: 18,
        fontFamily: 'monospace',
        letterSpacing: 1.5,
    },
    buttonContainer: {
        height: '100%',
        width: '100%',
        top: 20,
        justifyContent: 'top',
        alignItems: 'center',
        gap: 13,
        paddingHorizontal: 20,
    },
    noteButton: {
        backgroundColor: '#1E1B4B',
        width: '70%',
        paddingVertical: 30,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    buttonBack: {
        backgroundColor: '#F87171',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 50,
        left: 90,
    },
    buttonSubmit: {
        backgroundColor: '#A3E635',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        marginTop: 10,
        fontSize: 30,
        fontWeight: '600',
        color: 'white',
    },
    backContainer: {
        height: '100%',
        width: '100%',
    }


});


export default Notes;

