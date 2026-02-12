import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';

class FoodRecognitionService {
  constructor() {
    // ✅ Multi-source API key retrieval (works in dev and production)
    const getApiKey = (keyName) => {
      const sources = [
        // EAS Build environment
        Constants.expoConfig?.extra?.[keyName],
        Constants.manifest?.extra?.[keyName],
        Constants.manifest2?.extra?.expoClient?.extra?.[keyName],
        // Local development
        process.env[`EXPO_PUBLIC_${keyName}`],
        process.env[keyName]
      ];

      const key = sources.find(k => k && k.length > 0);

      if (!key) {
        console.warn(`⚠️ ${keyName} not found`);
      } else {
        console.log(`✅ ${keyName} loaded:`, key.substring(0, 10) + '...');
      }

      return key;
    };

    this.APIs = {
      GEMINI_KEY: getApiKey('GEMINI_API_KEY'),
      GEMINI_MODELS: [
        'gemini-2.0-flash-exp',    // PRIMARY: Latest experimental (Fastest)
        'gemini-1.5-pro',          // BACKUP: High Accuracy (Slower)
        'gemini-1.5-flash'         // BACKUP: Standard Flash
      ],
      GEMINI_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    };

    // Validate setup on initialization
    this.validateSetup();
  }

  validateSetup() {
    console.log('🔍 LPU Food Scanner - Setup Validation');
    console.log('📱 Environment:', __DEV__ ? 'Development' : 'Production');
    console.log('📱 Platform:', Constants.platform?.ios ? 'iOS' : 'Android');

    if (!this.APIs.GEMINI_KEY) {
      console.error('❌ CRITICAL: Gemini API key not found!');
      console.error('📋 Setup instructions:');
      console.error('1. Create .env file with EXPO_PUBLIC_GEMINI_API_KEY');
      console.error('2. Or run: eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY');
      console.error('3. Restart: npx expo start --clear');
      return false;
    }

    console.log('✅ API configuration complete');
    return true;
  }

  // ============================================================
  // NETWORK & IMAGE UTILITIES
  // ============================================================

  async safeFetch(url, options, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log('🌐 API Request:', url.substring(0, 70) + '...');

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', res.status);

      const text = await res.text();

      if (!res.ok) {
        console.error('❌ API Error:', text.substring(0, 200));
        throw new Error(`API error ${res.status}: ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.error('❌ Request timeout after', timeout, 'ms');
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      console.error('❌ Network error:', error.message);
      throw error;
    }
  }

  async imageToBase64(imageUri) {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      const manipulated = await ImageManipulator.manipulateAsync(imageUri, [], { base64: true });
      if (manipulated.base64) return manipulated.base64;
      throw new Error('Failed to convert image to Base64');
    }
  }

  async optimizeImageForAI(imageUri) {
    try {
      console.log('🖼️ Optimizing image...');

      const optimized = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Increased from 512 for better accuracy (Roti counting)
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      console.log('✅ Image optimized');
      return optimized.base64;
    } catch (error) {
      console.warn('⚠️ Optimization failed:', error.message);
      return await this.imageToBase64(imageUri);
    }
  }

  // ============================================================
  // AI PROMPTS
  // ============================================================

  createCompleteDetectionPrompt() {
    return `You are an expert Indian nutritionist. Analyze the food image and return valid JSON with MACROS ONLY.
    
 STRICT RULES:
 1. **NO MICRONUTRIENTS**: Do not estimate Iron, Calcium, Vitamin C, Sodium, Sugar.
 2. **NO INGREDIENTS LIST**: Do not list ingredients.
 3. **STRICT WEIGHT ESTIMATION**: Visually estimate portion size relative to a standard plate. Do NOT use default weights. Account for partial portions (e.g. half roti).
 4. **COUNT ACCURACY**: 
    - Look closely for stacked items (especially Roti/Chapati/Puri). If you see 2, count 2.
    - Count individual pieces of meat (e.g., Chicken Tikka/Fry) even if piled together.
 5. **SPECIFIC NAMES**: Distinguish "Rice" from "Biryani" or "Pulao". If you see meat/veg mixed in rice, label it accurately (e.g., "Chicken Biryani").
 6. **NO HALLUCINATIONS**: Do NOT double count items. If a curry looks like it has multiple components, count it as ONE dish.

 STRUCTURE:
 {
   "detectedItems": [
     {
       "foodName": "specific dish name",
       "visibleCount": number,
       "perUnitWeight": "estimated weight (e.g., '150g' or 'approx 1 bowl')",
       "perUnitNutrition": {
         "calories": number,
         "protein": number,
         "carbs": number,
         "fat": number,
         "fiber": number
       },
       "category": "Food Category",
       "healthScore": 1-10,
       "tips": "Brief health tip"
     }
   ],
   "confidence": 0.9
 }`;
  }

  createUserAssistedPrompt(userInput) {
    return `User says image contains: "${userInput}"

 STRICT RULES:
 1. Focus on identifying the items mentioned by user, plus any others clearly visible.
 2. **NO MICRONUTRIENTS**: Do not estimate Iron, Calcium, Vitamin C, Sodium, Sugar.
 3. **NO INGREDIENTS LIST**: Do not list ingredients.
 4. **STRICT WEIGHT ESTIMATION**: Visually estimate portion size. Do NOT use defaults.

 Return ONLY valid JSON:
 {
   "detectedItems": [
     {
       "foodName": "${userInput}",
       "visibleCount": count,
       "perUnitWeight": "estimated weight",
       "perUnitNutrition": {
         "calories": number,
         "protein": number,
         "carbs": number,
         "fat": number,
         "fiber": number
       },
       "category": "category",
       "healthScore": 1-10,
       "tips": "tip"
     }
   ],
   "confidence": 0.9
 }`;
  }

  // ============================================================
  // MAIN RECOGNITION METHOD
  // ============================================================

  async recognizeFood(imageUri, userInput = null) {
    console.log('🎯 Starting food recognition...');
    console.log('📸 Image URI:', imageUri);

    // Pre-flight validation
    if (!this.APIs.GEMINI_KEY) {
      console.error('❌ Cannot proceed: API key missing');
      alert('Configuration Error: API key not configured. Please check app setup.');
      return this.getFallbackData(imageUri, userInput);
    }

    const startTime = Date.now();

    try {
      const base64Image = await this.optimizeImageForAI(imageUri);
      console.log(`⚡ Image processed in ${Date.now() - startTime}ms`);
      console.log('📦 Base64 size:', base64Image?.length);

      const prompt = userInput ?
        this.createUserAssistedPrompt(userInput) :
        this.createCompleteDetectionPrompt();

      // Try models in order
      for (let i = 0; i < this.APIs.GEMINI_MODELS.length; i++) {
        const model = this.APIs.GEMINI_MODELS[i];

        try {
          console.log(`🧠 Trying ${model}...`);

          const result = await this.analyzeWithGemini(base64Image, prompt, model, userInput);

          if (result) {
            const totalTime = Date.now() - startTime;
            console.log(`✅ ${model} succeeded in ${totalTime}ms`);

            return {
              ...result,
              usedModel: model, // Return the actual model name used
              imageUri,
              userInput,
              processingTime: totalTime
            };
          }
        } catch (error) {
          console.warn(`⚠️ ${model} failed:`, error.message);

          if (i < this.APIs.GEMINI_MODELS.length - 1) {
            console.log(`🔄 Trying backup model...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
      }

      console.log('🔄 All models failed, using fallback');
      return this.getFallbackData(imageUri, userInput);

    } catch (error) {
      console.error('❌ Recognition failed:', error);
      return this.getFallbackData(imageUri, userInput);
    }
  }

  async analyzeWithGemini(base64Image, prompt, model, userInput = null) {
    if (!this.APIs.GEMINI_KEY) {
      throw new Error('Missing Gemini API key');
    }

    const url = `${this.APIs.GEMINI_URL}/${model}:generateContent?key=${this.APIs.GEMINI_KEY}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048, // Reduced token limit for speed
        topK: 32,
        topP: 1,
        responseMimeType: "application/json"
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const response = await this.safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 20000); // Reduced timeout to 20s

    const candidate = response?.candidates?.[0];
    if (!candidate) throw new Error('No response from Gemini');

    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`Gemini stopped: ${finishReason}`);
    }

    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    console.log('✅ Response received');
    return await this.processGeminiResponse(text, userInput);
  }

  // ============================================================
  // RESPONSE PROCESSING
  // ============================================================

  async processGeminiResponse(text, userInput = null) {
    try {
      console.log('🔍 Parsing response...');

      let cleanText = text.trim();
      cleanText = cleanText.replace(/``````\\n?/g, ''); // Fix markdown cleanup

      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}') + 1;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanText.substring(jsonStart, jsonEnd);
        const parsedData = JSON.parse(jsonString);

        console.log('✅ Successfully parsed');
        return this.formatFoodData(parsedData, userInput);
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('❌ Parsing failed:', error);
      throw error;
    }
  }

  formatFoodData(data, userInput = null) {
    if (!data.detectedItems || data.detectedItems.length === 0) {
      throw new Error('No items detected');
    }

    const processedItems = data.detectedItems.map(item => {
      const count = parseInt(item.visibleCount) || 1;
      const perUnitNutrition = item.perUnitNutrition || {};

      // Calculate total nutrition
      const totalNutrition = {};
      Object.keys(perUnitNutrition).forEach(key => {
        const value = perUnitNutrition[key] * count;
        // Round to 1 decimal place, integer for cals
        totalNutrition[key] = key === 'calories' ? Math.round(value) : Math.round(value * 10) / 10;
      });

      return {
        name: item.foodName,
        visibleCount: count,
        perUnitWeight: item.perUnitWeight || '100g', // Fallback if AI fails strict instruction
        // Fix: Handle string weights like "approx 1 bowl" gracefully
        totalWeight: count > 1 ? `${count}x ${item.perUnitWeight}` : item.perUnitWeight,
        perUnitNutrition: perUnitNutrition,
        totalNutrition: totalNutrition,
        category: item.category || 'Food Item',
        healthScore: item.healthScore || 6,
        tips: item.tips || 'Enjoy as part of a balanced diet',
        userProvided: userInput ? true : false,
        portion: {
          size: count > 3 ? 'Large' : count > 1 ? 'Medium' : 'Small',
          quantity: `${count} piece${count > 1 ? 's' : ''}`,
          weight: item.perUnitWeight // Pass visual estimate
        }
      };
    });

    // Calculate grand totals (MACROS ONLY)
    const grandTotalNutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0
    };

    processedItems.forEach(item => {
      Object.keys(grandTotalNutrition).forEach(key => {
        grandTotalNutrition[key] += item.totalNutrition[key] || 0;
      });
    });

    // Formatting
    Object.keys(grandTotalNutrition).forEach(key => {
      grandTotalNutrition[key] = key === 'calories' ?
        Math.round(grandTotalNutrition[key]) :
        Math.round(grandTotalNutrition[key] * 10) / 10;
    });

    const totalPieces = processedItems.reduce((sum, item) => sum + item.visibleCount, 0);
    // Fix: Only sum valid integer weights for total, otherwise use generic description
    const totalWeightInt = processedItems.reduce((sum, item) => {
      const w = parseInt(item.perUnitWeight);
      return sum + (isNaN(w) ? 0 : w * item.visibleCount);
    }, 0);
    const totalWeightStr = totalWeightInt > 0 ? `${totalWeightInt}g` : 'Total Meal';

    return {
      foodName: this.createFoodName(processedItems),
      isComboMeal: processedItems.length > 1,
      itemCount: processedItems.length,
      totalFoodPieces: totalPieces,
      individualItems: processedItems,
      confidence: data.confidence || 0.9,
      category: processedItems.length > 1 ? 'Combo Meal' : processedItems[0].category,
      servingSize: `${totalPieces} items (${totalWeightStr})`,
      nutrition: grandTotalNutrition,
      healthScore: this.calculateHealthScore(grandTotalNutrition),
      dietaryInfo: this.getDietaryInfo(processedItems),
      tips: this.generateTips(processedItems, grandTotalNutrition),
      method: 'Gemini 1.5 Flash (Optimized)',
      timestamp: new Date().toISOString(),
      userAssisted: userInput ? true : false,
      hasAIGeneratedNutrition: true
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  createFoodName(items) {
    if (items.length === 1) {
      const item = items[0];
      return item.visibleCount > 1 ?
        `${item.visibleCount} ${item.name}s` :
        item.name;
    }
    const descriptions = items.slice(0, 3).map(item =>
      `${item.visibleCount} ${item.name}${item.visibleCount > 1 ? 's' : ''}`
    );
    return `Combo: ${descriptions.join(' + ')}${items.length > 3 ? ' + more' : ''}`;
  }

  calculateHealthScore(nutrition) {
    let score = 6;
    if (nutrition.protein > 15) score += 1;
    if (nutrition.fiber > 8) score += 1;
    if (nutrition.calories > 800) score -= 0.5;
    if (nutrition.fat > 30) score -= 0.5;
    return Math.max(1, Math.min(10, Math.round(score * 2) / 2));
  }

  getDietaryInfo(items) {
    const totalProtein = items.reduce((sum, item) => sum + (item.totalNutrition?.protein || 0), 0);
    return {
      isHighProtein: totalProtein > 20,
      isBalanced: items.length >= 2,
      note: "Dietary flags (Vegan/GF) removed for speed"
    };
  }

  generateTips(items, nutrition) {
    const tips = [];
    const totalPieces = items.reduce((sum, item) => sum + item.visibleCount, 0);

    if (totalPieces >= 6) tips.push('Large meal - consider sharing');
    if (nutrition.protein > 20) tips.push(`High protein (${nutrition.protein}g)`);
    if (nutrition.calories > 600) tips.push('High-calorie meal');

    return tips.length > 0 ? tips.join('. ') + '.' : 'Enjoy your meal!';
  }

  getFallbackData(imageUri, userInput = null) {
    return {
      foodName: 'Indian Meal',
      isComboMeal: false,
      itemCount: 1,
      totalFoodPieces: 1,
      individualItems: [{
        name: 'Mixed Food',
        visibleCount: 1,
        perUnitWeight: '200g',
        totalWeight: '200g',
        perUnitNutrition: {
          calories: 300, protein: 10, carbs: 40, fat: 10, fiber: 5
        },
        totalNutrition: {
          calories: 300, protein: 10, carbs: 40, fat: 10, fiber: 5
        },
        category: 'Food',
        healthScore: 6,
        tips: 'Unable to analyze - estimate only',
        portion: { size: 'Small', quantity: '1 piece', weight: '200g' }
      }],
      confidence: 0.5,
      category: 'Food',
      nutrition: {
        calories: 300, protein: 10, carbs: 40, fat: 10, fiber: 5
      },
      healthScore: 6,
      dietaryInfo: { isHighProtein: false, isBalanced: false },
      tips: 'Analysis failed - using estimates',
      method: 'Fallback',
      timestamp: new Date().toISOString(),
      userAssisted: userInput ? true : false,
      isEstimate: true,
      hasAIGeneratedNutrition: false
    };
  }

  // ============================================================
  // BARCODE RECOGNITION (Unchanged macros only)
  // ============================================================

  async recognizeBarcode(barcode) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      const product = data.product;

      if (!product) throw new Error('Product not found');

      const nutriments = product.nutriments || {};

      return {
        foodName: product.product_name || 'Unknown Product',
        isComboMeal: false,
        itemCount: 1,
        totalFoodPieces: 1,
        confidence: 0.95,
        category: 'Packaged Food',
        servingSize: '100g',
        brand: product.brands || 'Unknown Brand',
        nutrition: {
          calories: Math.round(nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
          fiber: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
        },
        ingredients: [], // Removed for consistency
        healthScore: this.calculateHealthScore({
          protein: nutriments.proteins_100g || 0,
          fiber: nutriments.fiber_100g || 0,
          calories: nutriments['energy-kcal_100g'] || 0,
          fat: nutriments.fat_100g || 0,
        }),
        dietaryInfo: {
          isLowCarb: (nutriments.carbohydrates_100g || 0) < 10,
          isHighProtein: (nutriments.proteins_100g || 0) > 15
        },
        tips: 'Check product label for complete information',
        method: 'Barcode Recognition',
        timestamp: new Date().toISOString(),
        barcode: barcode,
        hasAIGeneratedNutrition: false
      };
    } catch (error) {
      console.error('❌ Barcode error:', error);
      throw new Error(`Could not find product: ${barcode}`);
    }
  }
}

export default new FoodRecognitionService();

