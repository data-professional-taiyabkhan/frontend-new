// Test script to verify Python voice integration
import pythonVoiceService from './pythonVoiceService';

export const testPythonVoiceIntegration = async () => {
  console.log('🧪 Testing Python Voice Integration...');
  
  try {
    // Test 1: API Connection
    console.log('1️⃣ Testing API connection...');
    const isConnected = await pythonVoiceService.testConnection();
    
    if (!isConnected) {
      console.error('❌ API connection failed');
      return { success: false, error: 'API connection failed' };
    }
    
    console.log('✅ API connection successful');
    
    // Test 2: Service Status
    console.log('2️⃣ Checking service status...');
    const status = pythonVoiceService.getStatus();
    console.log('📊 Service Status:', status);
    
    // Test 3: Add Test Listener
    console.log('3️⃣ Adding test listener...');
    let wakeWordDetected = false;
    
    const testListener = () => {
      console.log('🎉 Wake word detected in test!');
      wakeWordDetected = true;
    };
    
    pythonVoiceService.addListener(testListener);
    
    // Test 4: Start Detection (briefly)
    console.log('4️⃣ Starting voice detection for 5 seconds...');
    await pythonVoiceService.startDetection();
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Stop detection
    await pythonVoiceService.stopDetection();
    
    // Cleanup
    pythonVoiceService.removeListener(testListener);
    
    console.log('✅ Integration test completed');
    return {
      success: true,
      apiConnected: isConnected,
      serviceStatus: status,
      wakeWordDetected
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default testPythonVoiceIntegration;
