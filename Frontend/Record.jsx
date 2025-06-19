import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';


/**
 * This is the Record page of the application.
 */
const Record = () => {


    const [message, setMessage] = useState("");
    const [timer, setTimer] = useState(0);
    const [startTimer, setStartTimer] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [displayNotes, setDisplayNotes] = useState(false);
    const [notes, setNotes] = useState();


    useEffect(() => {
        let time;


        if (startTimer) {
            time = setInterval(() => {
                setTimer(prev => prev + 1)
            }, 1000);


            if (Math.floor(timer / 60) == 10) {
                handleTimeLimit();
            }
        }


        return () => clearInterval(time);
    }, [timer, startTimer]);


    const handleStartRecording = () => {
        setStartTimer(true);
    };


    const handleRestartRecording = () => {
        setTimer(0);
        setStartTimer(true);
        setIsStopped(false);
    };


    const handleStopRecording = () => {
        setStartTimer(false);
        setIsStopped(true);
    };


    const handleGenerateNotes = () => {
        setTimer(0);
        setStartTimer(false);
        setIsStopped(true);
        setDisplayNotes(true);
        setMessage("Here is your first message");
    }


    const handleTimeLimit = () => {
        setStartTimer(false);
        setIsStopped(true);
        setMessage("TimeLimit Reached");
    };


    const handleSaveNote = () => {
        setNotes(message);
        setMessage('Note Saved to Database');
        setDisplayNotes(false);
        setIsStopped(false);
        setTimer(0);
    }


    const handleRegenerateNote = () => {
        setMessage("Regenerated Note");
    }


    return (
        <>
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#6C63FF', '#7F56D9']}
                    style={styles.header}
                >
                    <Text name='displayScreen' style={styles.title}>
                        Start Recording your Session.
                    </Text>


                    <View style={styles.container}>
                        {/* Timer */}
                        <View style={styles.timerContainer}>
                            {displayNotes ?
                                <Text style={styles.timerText}>
                                    {message}s
                                </Text>
                                :
                                <Text style={styles.timerText}>
                                    {Math.floor(timer / 60)}m:{String(timer % 60).padStart(2, '0')}s
                                </Text>
                            }
                        </View>
                        {
                            !displayNotes ?
                                <View style={styles.buttonContainer}>
                                    {!isStopped ?
                                        <TouchableOpacity style={styles.buttonStart} onPress={handleStartRecording}>
                                            <Ionicons name='mic' size={28} color="white" />
                                            <Text style={styles.buttonText}>Start</Text>
                                        </TouchableOpacity>
                                        :
                                        <TouchableOpacity style={styles.buttonStart} onPress={handleRestartRecording}>
                                            <Ionicons name='reload-circle' size={28} color="white" />
                                            <Text style={styles.buttonText}>Restart</Text>
                                        </TouchableOpacity>
                                    }


                                    {!isStopped ?
                                        <TouchableOpacity style={styles.buttonStop} onPress={handleStopRecording}>
                                            <Ionicons name='stop' size={28} color='white' />
                                            <Text style={styles.buttonText}>Stop</Text>
                                        </TouchableOpacity>
                                        :
                                        <TouchableOpacity style={styles.buttonGenerate} onPress={handleGenerateNotes} >
                                            <Ionicons name='sparkles' size={28} color='white' />
                                            <Text style={styles.buttonText}>Generate Notes</Text>
                                        </TouchableOpacity>
                                    }
                                </View>
                                :


                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity style={styles.buttonSaveNotes} onPress={handleSaveNote}>
                                        <Ionicons name='save' size={28} color="white" />
                                        <Text style={styles.buttonText}>Save Note</Text>
                                    </TouchableOpacity>


                                    <TouchableOpacity style={styles.buttonRegenerate} onPress={handleRegenerateNote}>
                                        <Ionicons name='sparkles' size={28} color="white" />
                                        <Text style={styles.buttonText}>Recreate Note</Text>
                                    </TouchableOpacity>
                                </View>


                        }


                    </View>
                </LinearGradient>
            </SafeAreaView>
        </>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    timerContainer: {
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


    timerText: {
        color: '#c0c0c0',
        fontSize: 18,
        fontFamily: 'monospace',
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        paddingTop: 20,
        paddingLeft: 10,
        color: '#F1F5F9',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#E2E8F0',
    }, header: {
        height: '100%',
        width: '100%'
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 30,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    buttonStart: {
        backgroundColor: '#A3E635',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonStop: {
        backgroundColor: '#F87171',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonGenerate: {
        backgroundColor: 'violet',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    }, buttonRegenerate: {
        backgroundColor: '#FFA552',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonSaveNotes: {
        backgroundColor: '#191970',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        marginTop: 10,
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    }
});


export default Record;



