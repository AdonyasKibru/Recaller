import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // For icons


const Q1 = {
    isCheckBox: false,
    Question: 'What is the correct way to display information in Python?',
    choiceA: 'print("Hello")',
    choiceB: 'echo "Hello"',
    choiceC: 'printf("Hello")',
    choiceD: 'display("Hello")',
    Answer: 'print("Hello")',
};


const Q2 = {
    isCheckBox: false,
    Question: 'Which is correct',
    choiceA: 'print("Hello")',
    choiceB: 'echo "Hello"',
    choiceC: 'printf("Hello")',
    choiceD: 'display("Hello")',
    Answer: 'print("Hello"),'
};


const Quizzes = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [question, setQuestion] = useState([]);
    const [questionValue, setQuestionValue] = useState("");
    const [choices, setChoices] = useState([]);
    const [timer, setTimer] = useState(0);
    const [startTimer, setStartTimer] = useState(false);
    const [message, setMessage] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [timeSpend, setTimeSpend] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        const loadQuestion = [Q1, Q2];
        setQuestion(loadQuestion);


    }, []);


    useEffect(() => {
        if (question.length > 0) {
            const current = question[currentQuestion];
            setQuestionValue(current.Question);


            const extractedChoices = Object.entries(current)
                .filter(([key]) => key.startsWith('choice'))
                .map(([key, value]) => ({
                    id: key.slice(-1),
                    text: value,
                }));


            setChoices(extractedChoices);
            setStartTimer(true);
        }


    }, [question, currentQuestion]);


    useEffect(() => {
        let time;
        time = setInterval(() => { setTimer(prev => prev + 1) }, 1000);
        return () => clearInterval(time);


    }, [timer, startTimer]);


    const frontInterpolate = animatedValue.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg']
    });


    const backInterpolate = animatedValue.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg']
    });


    const flipCard = () => {
        if (isFlipped) {
            Animated.spring(animatedValue, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(animatedValue, {
                toValue: 180,
                useNativeDriver: true,
            }).start();
        }
        setIsFlipped(!isFlipped);
    };


    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }]
    };


    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }]
    };


    const handleSubmit = () => {
        setMessage("submitted");
        setStartTimer(false);
        setShowResult(true);
        setTimeSpend(timer);
        setTimer(0);
    }


    const handleBack = () => {
        setCurrentQuestion(prev => prev - 1);


        if (currentQuestion >= 0) {
            const current = question[currentQuestion];
            setQuestionValue(current.Question);


            const extractedChoices = Object.entries('current')
                .filter(([key]) => key.startsWith('choice'))
                .map(([key, value]) => ({
                    id: key.slice(-1),
                    text: value,
                }));


            setChoices(extractedChoices);
        }
    };


    const handleNext = () => {
        setCurrentQuestion(prev => prev + 1);


        if (currentQuestion < question.length) {
            const current = question[currentQuestion];
            setQuestionValue(current.Question);


            const extractedChoices = Object.entries('current')
                .filter(([key]) => key.startsWith('choice'))
                .map(([key, value]) => ({
                    id: key.slice(-1),
                    text: value,
                }));


            setChoices(extractedChoices);
        } else {
            handleSubmit();
        }


    };


    return (
        <>
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#6C63FF', '#7F56D9']}
                    style={styles.header}
                >


                    {!showResult ?
                        <View style={styles.container}>
                            <View style={styles.timerContainer}>
                                <Text style={styles.timerText}>
                                    {Math.floor(timer / 60)}m:{String(timer % 60).padStart(2, '0')}s
                                </Text>
                            </View>


                            <View style={styles.cardContainer}>
                                <TouchableOpacity onPress={flipCard}>
                                    <Animated.View style={[styles.flashcard, frontAnimatedStyle, { position: 'absolute', backfaceVisibility: 'hidden' }]}>
                                        <Text style={styles.choices}>{questionValue}</Text>
                                        {choices.map(choice => (
                                            <Text key={choice.id}>{choice.id}: {choice.text}</Text>
                                        ))}
                                    </Animated.View>


                                    <Animated.View style={[styles.flashcard, backAnimatedStyle, { backfaceVisibility: 'hidden' }]}>
                                        <Text style={styles.correctAnswer}>Correct Answer:</Text>
                                        <Text style={styles.correctAnswerText}>A: print("Hello")</Text>
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>


                            <View style={styles.buttonContainer}>


                                <TouchableOpacity name='Back' onPress={handleBack} style={styles.buttonBack} disabled={currentQuestion - 1 < 0}>
                                    <Ionicons name='arrow-back' size={28} color='white' />
                                    <Text name='Back' style={styles.text}>Back</Text>
                                </TouchableOpacity>


                                {currentQuestion + 1 !== question.length ?
                                    <TouchableOpacity name='Next' style={styles.buttonNext} onPress={handleNext}>
                                        <Ionicons name='arrow-forward' size={28} color='white' />
                                        <Text name='Next' style={styles.text}>Next</Text>
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity name='Submit' style={styles.buttonSubmit} onPress={handleSubmit}>
                                        <Text name='Submit' style={styles.buttonText}>Done</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        </View>
                        :


                        <View style={styles.timerContainer}>
                            <Text style={styles.title}> You finished in: </Text>
                            <Text style={styles.timerText}>
                                {Math.floor(timeSpend / 60)}m:{String(timeSpend % 60).padStart(2, '0')}s
                            </Text>
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
        fontSize: 30,
        fontFamily: 'monospace',
        letterSpacing: 1.5,
        paddingLeft: 35,
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
    buttonNext: {
        backgroundColor: '#A3E635',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonBack: {
        backgroundColor: '#F87171',
        width: '45%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    }, buttonSubmit: {
        backgroundColor: '#A3E635',
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
    },
    cardContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flashcard: {
        width: 300,
        height: 200,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backfaceVisibility: 'hidden',
    },
    choices: {
        fontSize: 18,
        marginBottom: 10,
    },
    correctAnswer: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 5,
    },
    correctAnswerText: {
        fontSize: 16,
        color: 'green',
    },
    choices: {
        color: 'black'
    }
});


export default Quizzes;

