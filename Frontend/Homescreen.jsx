import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
