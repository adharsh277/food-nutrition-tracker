import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google'; // Google Login Disabled
import { useAuth } from '../../context/AuthContext';
// import { makeRedirectUri } from 'expo-auth-session'; // Google Login Disabled

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const ANDROID_CLIENT_ID =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL;

  /*
  // Hardcoded Redirect URI for Expo Go
  // This MUST match the URI in Google Cloud Console -> Authorized redirect URIs
  // NOTE: Changed to lowercase slug as Expo often normalizes it
  const finalRedirectUri = 'https://auth.expo.io/@aniket7992/lpu-food-scanner';

  console.log('Using Redirect URI:', finalRedirectUri);

  console.log('Using Redirect URI:', finalRedirectUri);

  if (!ANDROID_CLIENT_ID) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Android Client ID missing</Text>
      </View>
    );
  }

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: finalRedirectUri,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response) {
      console.log('Google Auth Response:', JSON.stringify(response, null, 2));
    }
    if (response?.type === 'success') {
      const { id_token } = response.params;
      sendTokenToBackend(id_token);
    }
  }, [response]);
  */

  /*
  const sendTokenToBackend = async (idToken) => {
    const res = await fetch(
      `${API_BASE_URL}/api/auth/google/mobile`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    const data = await res.json();
    await login(data.token, data.user);
  };
  */


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await login(data.token, data.user);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LPU Food Scanner</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextBold}>Register</Text>
          </Text>
        </TouchableOpacity>

        {/* 
        <TouchableOpacity
          disabled={!request}
          onPress={() => promptAsync()}
          style={[styles.googleButton]}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity> 
        */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  form: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#333', // Force dark text
    backgroundColor: '#fff', // Ensure white background
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 16,
  },
  linkTextBold: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
