import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

// Import screens
import SigninScreen from './src/screens/SigninScreen';
import SignupScreen from './src/screens/SignupScreen';
import MotherDashboard from './src/screens/MotherDashboard';
import ChildDashboard from './src/screens/ChildDashboard';

const Stack = createStackNavigator();

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2c3e50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Signin"
            component={SigninScreen}
            options={{
              title: 'Sign In',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{
              title: 'Create Account',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="MotherDashboard"
            component={MotherDashboard}
            options={{
              title: 'Parent Dashboard',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ChildDashboard"
            component={ChildDashboard}
            options={{
              title: 'Child Dashboard',
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
