import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

const ScannerScreen = ({ navigation }) => {
  // Permission states
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
  
  // Camera states
  const [cameraFacing, setCameraFacing] = useState('back');
  const [flashMode, setFlashMode] = useState('off');
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  // Scanning states
  const [scanned, setScanned] = useState(false);
  const [barcodeData, setBarcodeData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState('photo'); // 'photo' or 'barcode'
  
  // UI states
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  
  // 🎯 NEW: User input states
  const [showUserInputModal, setShowUserInputModal] = useState(false);
  const [userFoodInput, setUserFoodInput] = useState('');
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  
  const cameraRef = useRef(null);

  // 🎯 NEW: Quick food options for faster input
  const quickFoodOptions = [
    '2 parathas', '3 parathas', '4 parathas', '1 dosa', '2 dosas',
    '1 samosa', '2 samosas', '3 bondas', '1 poori', '2 pooris',
    'dal rice', 'biryani', 'thali', 'mixed sabzi'
  ];

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus.status === 'granted');

    const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
    setHasMediaLibraryPermission(mediaLibraryStatus.status === 'granted');

    if (cameraStatus.status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to scan food items.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => requestPermissions() }
        ]
      );
    }
  };

  const handleBarCodeScanned = useCallback(({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      setBarcodeData({ type, data });
      setShowBarcodeModal(true);
    }
  }, [scanned]);

  // 🎯 ENHANCED: Take picture with optional user input
  const takePicture = async () => {
    if (cameraRef.current && !isAnalyzing) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });

        setCapturedPhoto(photo);
        setShowPhotoPreview(true);

      } catch (error) {
        Alert.alert('Error', 'Failed to take picture: ' + error.message);
      }
    }
  };

  // 🎯 NEW: Show user input modal before analysis
  const showInputOptions = () => {
    setShowPhotoPreview(false);
    setShowUserInputModal(true);
  };

  // 🎯 NEW: Analyze with user input
  const analyzeWithUserInput = async (userInput = null) => {
    setShowUserInputModal(false);
    setIsAnalyzing(true);

    try {
      const FoodRecognitionService = (await import('../services/foodRecognition')).default;
      
      console.log('🎯 Analyzing with user input:', userInput);
      const foodData = await FoodRecognitionService.recognizeFood(capturedPhoto.uri, userInput);
      
      setIsAnalyzing(false);
      
      navigation.navigate('ScanResult', {
        imageUri: capturedPhoto.uri,
        foodData: foodData,
        isBarcode: false,
        userInput: userInput
      });

    } catch (error) {
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Failed',
        error.message,
        [
          { text: 'Try Again', onPress: () => showInputOptions() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  // 🎯 NEW: Quick option selection
  const selectQuickOption = (option) => {
    setUserFoodInput(option);
    setShowQuickOptions(false);
  };

  const savePhoto = async (photoUri) => {
    if (hasMediaLibraryPermission) {
      try {
        await MediaLibrary.saveToLibraryAsync(photoUri);
        Alert.alert('Success', 'Photo saved to gallery!');
      } catch (error) {
        Alert.alert('Error', 'Failed to save photo: ' + error.message);
      }
    } else {
      Alert.alert('Permission Required', 'Please grant media library permission to save photos.');
    }
  };

  const processBarcodeData = async (data) => {
    setShowBarcodeModal(false);
    setScanned(false);
    setIsAnalyzing(true);

    try {
      const FoodRecognitionService = (await import('../services/foodRecognition')).default;
      const foodData = await FoodRecognitionService.recognizeBarcode(data.data);
      
      setIsAnalyzing(false);
      
      navigation.navigate('ScanResult', {
        imageUri: null,
        foodData: foodData,
        isBarcode: true
      });

    } catch (error) {
      setIsAnalyzing(false);
      Alert.alert('Barcode Not Found', error.message);
    } 
  };

const pickFromGallery = async () => {
  try {
    console.log('📱 Opening gallery...');
    
    // ✅ FIXED: Use string instead of ImagePicker.MediaType.Images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // ✅ Use string instead of enum
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    console.log('📸 Gallery result:', result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCapturedPhoto(result.assets[0]);
      setShowPhotoPreview(true);
      console.log('✅ Image selected from gallery');
    }

  } catch (error) {
    console.error('❌ Gallery error:', error);
    Alert.alert('Gallery Error', error.message);
  }
};



  const toggleCameraFacing = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  };

  const toggleScanMode = () => {
    setScanMode(current => current === 'photo' ? 'barcode' : 'photo');
    setScanned(false);
  };

  if (hasCameraPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color="#666" />
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <Text style={styles.permissionSubtext}>
          Please grant camera permission to scan food items and barcodes.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={cameraFacing}
        flash={flashMode}
        zoom={zoom}
        onBarcodeScanned={scanMode === 'barcode' && !scanned ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'code93', 'codabar', 'upc_e', 'upc_a'],
        }}
      />

      {/* Scanning overlay */}
      <View style={styles.overlay}>
        {scanMode === 'barcode' ? (
          <View style={styles.barcodeScanner}>
            <View style={styles.scannerFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Align barcode within the frame to scan
            </Text>
          </View>
        ) : (
          <View style={styles.photoMode}>
            <Text style={styles.instructionText}>
              Point camera at food item and tap capture
            </Text>
          </View>
        )}
      </View>

      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
          <Ionicons 
            name={flashMode === 'on' ? 'flash' : flashMode === 'auto' ? 'flash-outline' : 'flash-off'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.topButtonText}>
            {flashMode.charAt(0).toUpperCase() + flashMode.slice(1)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.topButton} onPress={toggleScanMode}>
          <Ionicons 
            name={scanMode === 'photo' ? 'camera' : 'barcode'} 
            size={24} 
            color="#4CAF50" 
          />
          <Text style={styles.topButtonText}>
            {scanMode === 'photo' ? 'Photo' : 'Barcode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isAnalyzing && styles.captureButtonDisabled]}
          onPress={takePicture}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Analysis overlay */}
      {isAnalyzing && (
        <View style={styles.analyzeOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.analyzeText}>
            {userFoodInput ? 'Analyzing with your input...' : 'Analyzing food item...'}
          </Text>
          {userFoodInput && (
            <Text style={styles.analyzeSubtext}>"{userFoodInput}"</Text>
          )}
        </View>
      )}

      {/* 🎯 NEW: User Input Modal */}
      <Modal
        visible={showUserInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserInputModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.userInputModalContent}>
            <Text style={styles.userInputTitle}>Help AI Identify Your Food</Text>
            <Text style={styles.userInputSubtitle}>
              Optional: Tell us what food items you see to improve accuracy
            </Text>

            {/* 🎯 Quick Options */}
            <View style={styles.quickOptionsContainer}>
              <TouchableOpacity 
                style={styles.quickOptionsToggle}
                onPress={() => setShowQuickOptions(!showQuickOptions)}
              >
                <Text style={styles.quickOptionsText}>Quick Options</Text>
                <Ionicons 
                  name={showQuickOptions ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#2196F3" 
                />
              </TouchableOpacity>

              {showQuickOptions && (
                <ScrollView style={styles.quickOptionsScroll} horizontal showsHorizontalScrollIndicator={false}>
                  {quickFoodOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickOptionChip}
                      onPress={() => selectQuickOption(option)}
                    >
                      <Text style={styles.quickOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.userInput}
              placeholder="e.g., '3 parathas and 2 bondas' or 'dal rice combo'"
              placeholderTextColor="#999"
              value={userFoodInput}
              onChangeText={setUserFoodInput}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Action Buttons */}
            <View style={styles.userInputButtons}>
              <TouchableOpacity
                style={[styles.userInputButton, styles.skipButton]}
                onPress={() => analyzeWithUserInput(null)}
              >
                <Ionicons name="camera" size={20} color="#666" />
                <Text style={styles.skipButtonText}>Auto Detect</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.userInputButton, styles.analyzeButton]}
                onPress={() => analyzeWithUserInput(userFoodInput.trim() || null)}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.analyzeButtonText}>
                  {userFoodInput.trim() ? 'Analyze with Hint' : 'Analyze'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal
        visible={showPhotoPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoPreview(false)}
      >
        <View style={styles.photoPreviewContainer}>
          {capturedPhoto && (
            <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
          )}
          
          <View style={styles.photoPreviewControls}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => setShowPhotoPreview(false)}
            >
              <Ionicons name="close" size={24} color="white" />
              <Text style={styles.previewButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => savePhoto(capturedPhoto.uri)}
            >
              <Ionicons name="save" size={24} color="white" />
              <Text style={styles.previewButtonText}>Save</Text>
            </TouchableOpacity>

            {/* 🎯 ENHANCED: New analyze option */}
            <TouchableOpacity
              style={[styles.previewButton, styles.analyzeButton]}
              onPress={showInputOptions}
            >
              <Ionicons name="analytics" size={24} color="white" />
              <Text style={styles.previewButtonText}>Analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barcode Modal (unchanged) */}
      <Modal
        visible={showBarcodeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Barcode Detected!</Text>
            <Text style={styles.modalText}>Type: {barcodeData?.type}</Text>
            <Text style={styles.modalText}>Data: {barcodeData?.data}</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowBarcodeModal(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.secondaryButtonText}>Scan Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => processBarcodeData(barcodeData)}
              >
                <Text style={styles.primaryButtonText}>Process</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (existing styles remain the same)
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  barcodeScanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoMode: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 150,
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 150,
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#4CAF50',
    borderWidth: 3,
    borderTopLeftRadius: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: -10,
    left: -10,
  },
  topRight: {
    borderTopRightRadius: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    top: -10,
    right: -10,
    left: 'auto',
  },
  bottomLeft: {
    borderBottomLeftRadius: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
    bottom: -10,
    left: -10,
    top: 'auto',
  },
  bottomRight: {
    borderBottomRightRadius: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: -10,
    right: -10,
    top: 'auto',
    left: 'auto',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  topButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
  },
  topButtonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  analyzeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  analyzeText: {
    color: 'white',
    fontSize: 18,
    marginTop: 15,
    textAlign: 'center',
  },
  analyzeSubtext: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 🎯 NEW: User Input Modal Styles
  userInputModalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  userInputTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  userInputSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  quickOptionsContainer: {
    marginBottom: 20,
  },
  quickOptionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  quickOptionsText: {
    fontSize: 16,
    color: '#2196F3',
    marginRight: 8,
    fontWeight: '500',
  },
  quickOptionsScroll: {
    maxHeight: 80,
  },
  quickOptionChip: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickOptionText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '500',
  },
  userInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 80,
    marginBottom: 20,
  },
  userInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInputButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
  },
  skipButtonText: {
    color: '#666',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  photoPreviewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  previewButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 80,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
});

export default ScannerScreen;
