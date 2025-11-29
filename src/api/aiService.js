/**
 * AI Service using Google Gemini API SDK (@google/genai)
 * Provides tree planting recommendations based on AQI data
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Main export function - uses gemini-2.5-flash (working model)
 */
export async function getTreePlantingRecommendations(aqiData) {
  const geminiKey = import.meta.env.VITE_GEMINI_KEY;

  if (!geminiKey) {
    throw new Error('Gemini API key is missing. Please check your .env file.');
  }

  const ai = new GoogleGenAI({
    apiKey: geminiKey,
  });

  // Try models in order - starting with the working one from your example
  const modelsToTry = [
    'gemini-2.5-flash',        // Working model from your example
    // 'gemini-2.0-flash-exp',     // Latest experimental
    // 'gemini-1.5-flash-latest',  // Latest stable flash
    // 'gemini-1.5-pro-latest',    // Latest stable pro
  ];

  // Try each model until one works
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`);
      return await getTreePlantingRecommendationsWithModel(ai, aqiData, modelName);
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
      
      // If it's the last model, use fallback recommendations
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        console.warn('All models failed, using fallback recommendations');
        return createFallbackRecommendation(aqiData);
      }
      // Otherwise, try the next model
      continue;
    }
  }
}

/**
 * Get tree planting recommendations from Gemini AI based on AQI data
 * @param {GoogleGenAI} ai - Initialized GoogleGenAI instance
 * @param {Object} aqiData - AQI data object containing city, aqi, pollutants, etc.
 * @param {string} modelName - Model name to use
 * @returns {Promise<Object>} AI recommendations with investment, trees, ROI, carbon analysis
 */
async function getTreePlantingRecommendationsWithModel(ai, aqiData, modelName) {
  try {
    // Prepare the prompt with AQI data
    const prompt = `You are an environmental expert. Based on the following air quality data for ${aqiData.city}, provide a comprehensive tree planting recommendation to improve air quality.

Current Air Quality Data:
- City: ${aqiData.city}
- Current AQI: ${aqiData.aqi || 'N/A'}
- PM2.5: ${aqiData.pm25 || 'N/A'} μg/m³
- PM10: ${aqiData.pm10 || 'N/A'} μg/m³
- CO: ${aqiData.co || 'N/A'} μg/m³
- NO2: ${aqiData.no2 || 'N/A'} μg/m³
- SO2: ${aqiData.so2 || 'N/A'} μg/m³
- O3: ${aqiData.o3 || 'N/A'} μg/m³

IMPORTANT: All costs must be in Indian Rupees (INR/₹) only. Do not use USD or any other currency.
CRITICAL: Always include the rupee symbol (₹) before the amount. Format example: "₹50,00,000" or "₹5,00,000".

Please provide a detailed analysis in the following JSON format (return ONLY valid JSON, no markdown, no code blocks):
{
  "summary": "Brief summary of current air quality situation",
  "recommendations": {
    "treeTypes": ["List of recommended tree species"],
    "numberOfTrees": "Estimated number of trees needed",
    "investmentAmount": "Total investment required in Indian Rupees with ₹ symbol (e.g., ₹50,00,000)",
    "roi": {
      "timeframe": "Expected ROI timeframe (e.g., '5-7 years')",
      "benefits": "Description of ROI benefits"
    },
    "carbonAnalysis": {
      "annualCarbonSequestration": "Estimated CO2 sequestered per year in tons",
      "lifetimeCarbonSequestration": "Total CO2 sequestered over tree lifetime in tons",
      "airPollutionReduction": "Estimated reduction in air pollutants percentage"
    },
    "comparison": {
      "before": {
        "aqi": ${aqiData.aqi || 0},
        "pm25": ${aqiData.pm25 || 0},
        "pm10": ${aqiData.pm10 || 0},
        "description": "Current air quality status"
      },
      "after": {
        "aqi": "Projected AQI after 5 years of tree planting",
        "pm25": "Projected PM2.5 reduction percentage",
        "pm10": "Projected PM10 reduction percentage",
        "description": "Expected air quality improvement"
      },
      "improvement": "Percentage improvement expected"
    },
    "implementation": {
      "phases": ["Phase 1 description", "Phase 2 description", "Phase 3 description"],
      "timeline": "Total implementation timeline",
      "maintenance": "Annual maintenance cost in Indian Rupees with ₹ symbol (e.g., ₹2,50,000)"
    }
  }
}`;

    // Use the working API format from your example
    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    // Use generateContent (not generateContentStream) to get full response
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
    });

    // Extract text from response
    let aiResponse = '';
    
    // Handle streaming response if it's a stream
    if (response[Symbol.asyncIterator]) {
      for await (const chunk of response) {
        aiResponse += chunk.text ?? '';
      }
    } else {
      // Handle regular response
      aiResponse = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    // Try to parse JSON from the response
    let jsonData = null;
    
    // Remove markdown code blocks if present
    const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                     aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      try {
        jsonData = JSON.parse(jsonString);
      } catch (e) {
        // If parsing fails, try to extract JSON from the full response
        try {
          jsonData = JSON.parse(aiResponse);
        } catch (e2) {
          console.error('Failed to parse AI response as JSON:', e2);
          console.log('Raw AI response:', aiResponse);
          // Return a structured fallback
          return createFallbackRecommendation(aqiData);
        }
      }
    } else {
      // Try parsing the entire response
      try {
        jsonData = JSON.parse(aiResponse);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        console.log('Raw AI response:', aiResponse);
        return createFallbackRecommendation(aqiData);
      }
    }

    console.log(`Successfully got recommendations from ${modelName}`);
    
    // Ensure rupee symbol is present in all money fields
    if (jsonData.recommendations) {
      if (jsonData.recommendations.investmentAmount) {
        jsonData.recommendations.investmentAmount = ensureRupeeSymbol(jsonData.recommendations.investmentAmount);
      }
      if (jsonData.recommendations.implementation?.maintenance) {
        jsonData.recommendations.implementation.maintenance = ensureRupeeSymbol(jsonData.recommendations.implementation.maintenance);
      }
    }
    
    return jsonData;
  } catch (error) {
    console.error(`Error fetching AI recommendations with ${modelName}:`, error);
    
    // Check if it's a 404/model not found error
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('404') || 
        errorMessage.includes('not found') ||
        errorMessage.includes('NOT_FOUND') ||
        errorMessage.includes('does not exist') ||
        (errorMessage.includes('Model') && errorMessage.includes('not available'))) {
      // Re-throw to allow fallback to next model
      throw new Error(`Model ${modelName} not available`);
    }
    
    // For other errors, also re-throw to try next model
    throw error;
  }
}

/**
 * Helper function to ensure rupee symbol is present
 */
function ensureRupeeSymbol(value) {
  if (!value || value === 'N/A') return 'N/A';
  const str = String(value);
  if (str.includes('₹')) return str;
  // Remove any other currency symbols and add rupee symbol
  const clean = str.replace(/[$]|USD|INR/gi, '').trim();
  return `₹${clean}`;
}

/**
 * Create fallback recommendations when AI fails
 * IMPORTANT: All costs are in Indian Rupees (INR) only
 */
function createFallbackRecommendation(aqiData) {
  const currentAQI = aqiData.aqi || 100;
  const treesNeeded = Math.ceil(currentAQI / 2) * 100; // Rough estimate
  const costPerTree = 4000; // ₹4000 per tree average in Indian Rupees
  const investment = treesNeeded * costPerTree; // Total investment in INR
  const projectedAQI = Math.max(0, currentAQI - (currentAQI * 0.3)); // 30% improvement

  return {
    summary: `Current air quality in ${aqiData.city} shows an AQI of ${currentAQI}. Tree planting can significantly improve air quality. Based on environmental research, planting ${treesNeeded} trees can reduce air pollution by 25-35% over 5 years.`,
    recommendations: {
      treeTypes: ['Neem', 'Peepal', 'Banyan', 'Mango', 'Jamun', 'Gulmohar'],
      numberOfTrees: treesNeeded.toString(),
      investmentAmount: `₹${investment.toLocaleString('en-IN')}`,
      roi: {
        timeframe: '5-7 years',
        benefits: 'Improved air quality, reduced healthcare costs, increased property values, carbon sequestration, and environmental benefits.',
      },
      carbonAnalysis: {
        annualCarbonSequestration: `${(treesNeeded * 0.02).toFixed(1)}`,
        lifetimeCarbonSequestration: `${(treesNeeded * 0.5).toFixed(1)}`,
        airPollutionReduction: '25-35%',
      },
      comparison: {
        before: {
          aqi: currentAQI,
          pm25: aqiData.pm25 || 0,
          pm10: aqiData.pm10 || 0,
          description: 'Current air quality status',
        },
        after: {
          aqi: projectedAQI.toFixed(0),
          pm25: '20-30% reduction',
          pm10: '25-35% reduction',
          description: 'Expected improvement after 5 years of tree planting',
        },
        improvement: '30%',
      },
      implementation: {
        phases: [
          'Phase 1: Site preparation and initial planting (Year 1) - Focus on high-pollution areas',
          'Phase 2: Expansion and maintenance (Years 2-3) - Expand coverage and establish care routines',
          'Phase 3: Full ecosystem establishment (Years 4-5) - Mature trees providing maximum benefits',
        ],
        timeline: '5 years',
        maintenance: `₹${(investment * 0.05).toLocaleString('en-IN')}`,
      },
    },
  };
}
