import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import Homescreen from './Frontend/Homescreen';
import Record from './Frontend/Record';
import Notes from './Frontend/Notes';
import Quizzes from './Frontend/Quizzes';


const Stack = createNativeStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Homescreen} />
        <Stack.Screen name="Record" component={Record} />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Quizzes" component={Quizzes} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}



