import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Category } from '../types/Article';
import { serviceTester } from '../utils/testServices';

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const runTest = async (category: Category, categoryName: string) => {
    setTesting(true);
    setTestResults(`Testing ${categoryName}...\n`);
    
    try {
      const response = await serviceTester.testSingleCategory(category, 5);
      
      let result = `✅ ${categoryName} Test Results:\n`;
      result += `Source: ${response.source}\n`;
      result += `Articles: ${response.data.length}\n`;
      result += `Has More: ${response.hasMore}\n\n`;
      
      if (response.data.length > 0) {
        result += `Sample Articles:\n`;
        response.data.slice(0, 2).forEach((article, i) => {
          result += `${i + 1}. ${article.title.slice(0, 50)}...\n`;
          result += `   Source: ${article.source}\n`;
        });
      }
      
      setTestResults(result);
    } catch (error) {
      setTestResults(`❌ Error testing ${categoryName}:\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const testCategories = [
    { cat: Category.SOFTWARE, name: 'Software' },
    { cat: Category.SPORTS, name: 'Sports' },
    { cat: Category.INDIA, name: 'India' },
    { cat: Category.POLITICAL, name: 'Political' },
    { cat: Category.WORLD, name: 'World' },
    { cat: Category.ALL, name: 'All' },
  ];

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.debugToggle}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.debugToggleText}>🔧</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.debugPanel}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>Debug Panel</Text>
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✖</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.testButtons}>
        {testCategories.map(({ cat, name }) => (
          <TouchableOpacity
            key={cat}
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={() => runTest(cat, name)}
            disabled={testing}
          >
            <Text style={styles.testButtonText}>Test {name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {testResults !== '' && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsText}>{testResults}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  debugToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  debugToggleText: {
    fontSize: 20,
    color: '#fff',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxHeight: 400,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  testButtons: {
    maxHeight: 120,
    paddingHorizontal: 15,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default DebugPanel;
