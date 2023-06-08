import React from "react";
import BottomTabNavigator from './components/BottomTabNavigator';
import Login from './screens/Login';
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{
        headerShown: false}}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="BottomTab" component={BottomTabNavigator} />
        </Stack.Navigator>
    </NavigationContainer>
  );
}