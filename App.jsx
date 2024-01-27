import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiAddress from './src/apiAddress';

import LoadingScreen from './src/LoadingScreen';
import LoginComponent from './src/login';
import HomeComponent from './src/home';
import WebViewComp from './src/webviewComp';


import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';


const Stack = createStackNavigator();


const App = () => {
  const [login, setLogin] = useState(false)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem('userToken');
        if (value !== null) {
          setLogin(true);
        } else {
          setLogin(false);
        }
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } catch (e) {
        console.log(e);
        setLoading(false);
      }
    })();
  }, []);

  const setLoginTrue = () => {
    setLogin(true);
  }

  const logout = async () => {
    try {
      const session = JSON.parse(await AsyncStorage.getItem('loginResponse'));
      const userId = await AsyncStorage.getItem('UserId');
      const token = await AsyncStorage.getItem('userToken');
      console.log(`User= ${userId}, Token= ${token}, Session= ${{...session}}`);

      if (!userId || !session || !token) {
        console.log(`User= ${userId}, Token= ${token}, Session= ${session}`);
        console.error('Missing required data for logout');
        return;
      }
  
      const response = await fetch(`${apiAddress}/api/logout?userid=${userId}&sessionId=${session.SessionId}`, {
        method: 'PUT',
        headers: { 'Authorization': token }
      });
  
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'Success') {
          AsyncStorage.clear();
          setLogin(false);
        } else {
          console.error('Logout failed:', data.message);
        }
      } else {
        console.error('Failed to logout:', response.statusText);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { height: 50 } }}>
      {loading
          ? <Stack.Screen name="Loading" component={LoadingScreen} options={{ title: 'ERP APP' }} />
          :  login
          ?
          <>
            <Stack.Screen name="Home">
              {(props) => <HomeComponent {...props} setLoginFalse={logout} />}
            </Stack.Screen>
            <Stack.Screen name="WebView" component={WebViewComp} options={{ title: 'SMT APP' }} />
          </>
          :
          <Stack.Screen name="Login">
            {(props) => <LoginComponent {...props} setLoginTrue={setLoginTrue} />}
          </Stack.Screen>
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default App;
