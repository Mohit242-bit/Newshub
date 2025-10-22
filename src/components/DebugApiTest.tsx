import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DebugApiTest: React.FC = () => {
  const [status, setStatus] = useState('Not started');
  const [results, setResults] = useState<string[]>([]);

  const testNewsApi = async () => {
    try {
      setStatus('Testing NewsAPI...');
      console.log('🧪 DebugApiTest: Starting NewsAPI test');
      
      const url = 'https://newsapi.org/v2/top-headlines?apiKey=74efa1095b4f4e66b201bc488ad62b01&country=us&pageSize=2';
      console.log('🧪 DebugApiTest: Making fetch request to:', url);
      
      const response = await fetch(url);
      console.log('🧪 DebugApiTest: Got response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🧪 DebugApiTest: Parsed JSON:', data);
      
      if (data.status !== 'ok') {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }
      
      const result = `✅ NewsAPI: ${data.articles.length} articles`;
      setResults(prev => [...prev, result]);
      console.log('🧪 DebugApiTest: Success -', result);
      
    } catch (error: any) {
      const errorMsg = `❌ NewsAPI: ${error.message}`;
      setResults(prev => [...prev, errorMsg]);
      console.error('🧪 DebugApiTest: NewsAPI failed:', error);
    }
  };

  const testDevTo = async () => {
    try {
      setStatus('Testing Dev.to...');
      console.log('🧪 DebugApiTest: Starting Dev.to test');
      
      const url = 'https://dev.to/api/articles?per_page=2';
      console.log('🧪 DebugApiTest: Making fetch request to:', url);
      
      const response = await fetch(url);
      console.log('🧪 DebugApiTest: Got response:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🧪 DebugApiTest: Parsed JSON, got', data.length, 'articles');
      
      const result = `✅ Dev.to: ${data.length} articles`;
      setResults(prev => [...prev, result]);
      console.log('🧪 DebugApiTest: Success -', result);
      
    } catch (error: any) {
      const errorMsg = `❌ Dev.to: ${error.message}`;
      setResults(prev => [...prev, errorMsg]);
      console.error('🧪 DebugApiTest: Dev.to failed:', error);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    setStatus('Running tests...');
    console.log('🧪 DebugApiTest: Starting all tests');
    
    await testNewsApi();
    await testDevTo();
    
    setStatus('Tests completed');
    console.log('🧪 DebugApiTest: All tests completed');
  };

  useEffect(() => {
    console.log('🧪 DebugApiTest: Component mounted');
    runAllTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug API Test</Text>
      <Text style={styles.status}>Status: {status}</Text>
      
      {results.map((result, index) => (
        <Text key={index} style={styles.result}>
          {result}
        </Text>
      ))}
      
      <TouchableOpacity style={styles.button} onPress={runAllTests}>
        <Text style={styles.buttonText}>Run Tests Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  result: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default DebugApiTest;