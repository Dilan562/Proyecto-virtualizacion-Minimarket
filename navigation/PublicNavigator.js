import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import HomeScreen from '../screens/public/HomeScreen';
import LoginScreen from '../screens/public/LoginScreen';
import RegisterScreen from '../screens/public/RegisterScreen';
import ProductDetailsScreen from '../screens/public/ProductDetailsScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';

const Stack = createStackNavigator();

const PublicNavigator = () => {
  const { authState } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Rutas públicas: accesibles sin necesidad de iniciar sesión*/}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />

      {/* Rutas protegidas según rol */}
      {authState?.role === 'admin' && (
        <Stack.Screen name="AdminDashboard" component={AdminNavigator} />
      )}
      {authState?.role === 'user' && (
        <Stack.Screen name="UserDashboard" component={UserNavigator} />
      )}
    </Stack.Navigator>
  );
  
};

export default PublicNavigator;
