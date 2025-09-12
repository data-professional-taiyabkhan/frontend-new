// Test script for Python API integration
// This can be used to test the API connection from React Native

const PYTHON_API_URL = 'https://mummyhelpwakeword.onrender.com';

export const testPythonAPI = async () => {
  console.log('🧪 Testing Python API connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${PYTHON_API_URL}/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ Health Check:', healthData);
    
    if (healthData.status === 'healthy') {
      console.log('🎉 Python API is working correctly!');
      return {
        success: true,
        message: 'API connection successful',
        data: healthData
      };
    } else {
      console.log('❌ API health check failed');
      return {
        success: false,
        message: 'API health check failed',
        data: healthData
      };
    }
    
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return {
      success: false,
      message: 'API connection failed',
      error: error.message
    };
  }
};

export const testWakeWordDetection = async (audioFile) => {
  console.log('🧪 Testing wake word detection...');
  
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioFile,
      type: 'audio/wav',
      name: 'test.wav',
    });
    
    const response = await fetch(`${PYTHON_API_URL}/detect-wake-word`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const result = await response.json();
    console.log('✅ Wake Word Detection Result:', result);
    
    return {
      success: true,
      detected: result.detected,
      transcript: result.transcript,
      data: result
    };
    
  } catch (error) {
    console.error('❌ Wake word detection failed:', error);
    return {
      success: false,
      message: 'Wake word detection failed',
      error: error.message
    };
  }
};

export default {
  testPythonAPI,
  testWakeWordDetection,
};
