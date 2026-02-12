// app.config.js
export default {
  expo: {
    name: "LPU-Food-Scanner",
    slug: "LPU-Food-Scanner",
    version: "1.0.0",
    scheme: "lpufoodscanner",
    orientation: "portrait",
    icon: "./assets/lpufoodapp.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/lpufoodapp.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "LPU Food Scanner needs access to your camera to scan food items and barcodes for nutritional analysis.",
        NSMicrophoneUsageDescription: "LPU Food Scanner may need microphone access for video recording features.",
        NSPhotoLibraryUsageDescription: "LPU Food Scanner needs access to your photo library to select images for food analysis.",
        NSPhotoLibraryAddUsageDescription: "LPU Food Scanner needs permission to save scanned food photos to your photo library.",
        // ✅ ADD: Network security for iOS
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "generativelanguage.googleapis.com": {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: "TLSv1.2"
            },
            "vision.googleapis.com": {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSIncludesSubdomains: true
            }
          }
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/lpufoodapp.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      // ✅ ADD: Critical for API calls
      usesCleartextTraffic: true,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
        "android.permission.ACCESS_MEDIA_LOCATION",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.ACTIVITY_RECOGNITION"
      ],
      package: "com.aniket7992.LPUFoodScanner"
    },
    web: {
      favicon: "./assets/lpufoodapp.png"
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow LPU Food Scanner to access your camera to scan food items and barcodes for nutritional analysis.",
          microphonePermission: "Allow LPU Food Scanner to access your microphone for video recording features.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow LPU Food Scanner to access your photos to select images for food analysis.",
          savePhotosPermission: "Allow LPU Food Scanner to save scanned food photos to your gallery.",
          isAccessMediaLocationEnabled: true
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "LPU Food Scanner needs access to your photo library to select food images for analysis."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "0f11db80-4bb6-49fc-abc4-94e0e1c95e41"
      },
      // ✅ UPDATED: Better environment variable handling
      GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      HUGGINGFACE_API_KEY: process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY,
      GOOGLE_VISION_KEY: process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY || process.env.GOOGLE_VISION_KEY
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/0f11db80-4bb6-49fc-abc4-94e0e1c95e41"
    }
  }
};
