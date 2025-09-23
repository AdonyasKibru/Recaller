
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './Frontend/Homescreen';
import RecordingsScreen from './Frontend/Record';
import NotesScreen from './Frontend/Notes';
import SettingsScreen from './Frontend/Setting';
import QuizzesScreen from './Frontend/Quizzes';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Record" component={RecordingsScreen} />
        <Stack.Screen name="Notes" component={NotesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Quizzes" component={QuizzesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
