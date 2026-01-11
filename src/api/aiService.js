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
    const currentAQI = aqiData.aqi || 0;

    // Prepare the prompt with AQI data
    const prompt = `You are an environmental expert. Based on the following air quality and weather data for ${aqiData.city}, provide a comprehensive tree planting recommendation and a 5-hour air quality forecast.

Current Air Quality & Weather Data:
- City: ${aqiData.city}
- Current AQI: ${currentAQI}
- PM2.5: ${aqiData.pm25 || 'N/A'} μg/m³
- PM10: ${aqiData.pm10 || 'N/A'} μg/m³
- CO: ${aqiData.co || 'N/A'} μg/m³
- NO2: ${aqiData.no2 || 'N/A'} μg/m³
- SO2: ${aqiData.so2 || 'N/A'} μg/m³
- O3: ${aqiData.o3 || 'N/A'} μg/m³
- Temperature: ${aqiData.temp || 'N/A'}°C
- Humidity: ${aqiData.humidity || 'N/A'}%
- Wind Speed: ${aqiData.wind || 'N/A'} m/s

CRITICAL CALCULATION RULES - YOU MUST FOLLOW THESE EXACTLY:
1. NUMBER OF TREES: Must be calculated based on AQI value using this formula:
   - For AQI 0-50 (Good): Trees = AQI × 50 to 100
   - For AQI 51-100 (Moderate): Trees = AQI × 100 to 150
   - For AQI 101-150 (Unhealthy for Sensitive): Trees = AQI × 150 to 200
   - For AQI 151-200 (Unhealthy): Trees = AQI × 200 to 250
   - For AQI 201-300 (Very Unhealthy): Trees = AQI × 250 to 300
   - For AQI 300+ (Hazardous): Trees = AQI × 300 to 350
   
   EXAMPLE: If AQI is 300, trees should be between 75,000 to 105,000 (300 × 250 to 300 × 350)
   EXAMPLE: If AQI is 60, trees should be between 6,000 to 9,000 (60 × 100 to 60 × 150)
   
   DO NOT use the same number of trees for different AQI values. Higher AQI MUST mean more trees.

2. INVESTMENT AMOUNT: Must be calculated as: numberOfTrees × costPerTree
   - Cost per tree in India: ₹3,000 to ₹5,000 (average ₹4,000)
   - Formula: investmentAmount = numberOfTrees × 4000
   - EXAMPLE: If 10,000 trees, investment = 10,000 × 4,000 = ₹4,00,00,000
   - EXAMPLE: If 7,500 trees, investment = 7,500 × 4,000 = ₹3,00,00,000
   
   DO NOT fabricate investment amounts. They MUST be calculated from tree count.

3. CONSISTENCY CHECK: 
   - Higher AQI MUST result in higher number of trees
   - Higher number of trees MUST result in higher investment
   - If AQI is 300, trees MUST be significantly more than if AQI is 60
   - All calculations must be proportional and logical

4. CARBON ANALYSIS:
   - Annual CO2 per tree: 0.02 to 0.03 tons/year
   - Formula: annualCarbonSequestration = numberOfTrees × 0.025
   - Lifetime CO2 per tree: 0.4 to 0.6 tons (over 20-30 years)
   - Formula: lifetimeCarbonSequestration = numberOfTrees × 0.5
   - Air pollution reduction: 20-35% over 5 years (higher for more trees)

5. PROJECTED AQI AFTER 5 YEARS:
   - Calculate based on tree count and current AQI
   - Formula: projectedAQI = currentAQI × (1 - (numberOfTrees / 100000) × 0.3)
   - Minimum improvement: 15-30% reduction
   - Higher tree count = better improvement

6. HOURLY FORECAST (Next 5 Hours):
   - Provide a realistic AQI forecast for the next 5 hours starting from the current local time.
   - Consider current weather patterns (wind speed dispersion, humidity impact).
   - Use your knowledge of typical urban pollution cycles (evening traffic peaks, etc.).
   - Return an array of exactly 5 objects.

STRICT REQUIREMENTS:
- DO NOT hallucinate or fabricate numbers
- DO NOT use the same values for different AQI levels
- ALL numbers MUST be calculated from the provided AQI value
- Investment MUST be proportional to tree count
- Higher AQI MUST mean more trees and higher investment
- Return ONLY valid JSON, no markdown, no code blocks, no explanations

IMPORTANT: All costs must be in Indian Rupees (INR/₹) only. Format: "₹50,00,000" (Indian numbering system).

Please provide a detailed analysis in the following JSON format (return ONLY valid JSON, no markdown, no code blocks):
{
  "summary": "Brief summary of current air quality and short-term outlook",
  "hourlyForecast": [
    { "time": "1 hour from now", "aqi": 125, "level": "Unhealthy" },
    { "time": "2 hours from now", "aqi": 128, "level": "Unhealthy" },
    { "time": "3 hours from now", "aqi": 130, "level": "Unhealthy" },
    { "time": "4 hours from now", "aqi": 122, "level": "Unhealthy" },
    { "time": "5 hours from now", "aqi": 115, "level": "Unhealthy for Sensitive Groups" }
  ],
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
        "aqi": ${currentAQI},
        "pm25": ${aqiData.pm25 || 0},
        "pm10": ${aqiData.pm10 || 0},
        "description": "Current air quality status"
      },
      "after": {
        "aqi": <CALCULATE: projected AQI as number, must be lower than ${currentAQI}>,
        "pm25": "<CALCULATE: percentage reduction like '25%' or '30%'>",
        "pm10": "<CALCULATE: percentage reduction like '25%' or '30%'>",
        "description": "Expected air quality improvement after 5 years"
      },
      "improvement": "<CALCULATE: percentage like '25%' or '30%' based on tree count>"
    },
    "humanImpact": {
        "healthBenefit": "Description of expected health improvements for residents",
        "economicBenefit": "Estimated healthcare cost savings or property value increase"
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

    // Validate and correct calculations based on AQI
    jsonData = validateAndCorrectRecommendations(jsonData, currentAQI);

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
 * Validate and correct recommendations to ensure they follow calculation rules
 */
function validateAndCorrectRecommendations(data, currentAQI) {
  if (!data.recommendations) return data;

  // Calculate expected number of trees based on AQI
  let expectedMinTrees, expectedMaxTrees;
  if (currentAQI <= 50) {
    expectedMinTrees = currentAQI * 50;
    expectedMaxTrees = currentAQI * 100;
  } else if (currentAQI <= 100) {
    expectedMinTrees = currentAQI * 100;
    expectedMaxTrees = currentAQI * 150;
  } else if (currentAQI <= 150) {
    expectedMinTrees = currentAQI * 150;
    expectedMaxTrees = currentAQI * 200;
  } else if (currentAQI <= 200) {
    expectedMinTrees = currentAQI * 200;
    expectedMaxTrees = currentAQI * 250;
  } else if (currentAQI <= 300) {
    expectedMinTrees = currentAQI * 250;
    expectedMaxTrees = currentAQI * 300;
  } else {
    expectedMinTrees = currentAQI * 300;
    expectedMaxTrees = currentAQI * 350;
  }

  // Get current tree count from AI response
  const currentTrees = parseInt(data.recommendations.numberOfTrees) || 0;

  // Validate tree count
  if (currentTrees < expectedMinTrees * 0.8 || currentTrees > expectedMaxTrees * 1.2) {
    // Recalculate trees based on AQI
    const calculatedTrees = Math.round((expectedMinTrees + expectedMaxTrees) / 2);
    console.warn(`Tree count ${currentTrees} doesn't match AQI ${currentAQI}. Recalculating to ${calculatedTrees}`);
    data.recommendations.numberOfTrees = calculatedTrees.toString();
  }

  // Recalculate investment based on corrected tree count
  const finalTreeCount = parseInt(data.recommendations.numberOfTrees) || 0;
  const costPerTree = 4000; // ₹4,000 per tree
  const calculatedInvestment = finalTreeCount * costPerTree;

  // Extract current investment amount (remove ₹ and commas)
  const currentInvestmentStr = String(data.recommendations.investmentAmount || '0')
    .replace(/₹|,|Rs|INR/gi, '')
    .trim();
  const currentInvestment = parseInt(currentInvestmentStr) || 0;

  // Validate investment (allow 20% variance for other costs)
  if (currentInvestment < calculatedInvestment * 0.7 || currentInvestment > calculatedInvestment * 1.3) {
    console.warn(`Investment ${currentInvestment} doesn't match tree count ${finalTreeCount}. Recalculating to ${calculatedInvestment}`);
    data.recommendations.investmentAmount = `₹${calculatedInvestment.toLocaleString('en-IN')}`;
  }

  // Recalculate carbon analysis based on tree count
  if (data.recommendations.carbonAnalysis) {
    const annualCarbon = (finalTreeCount * 0.025).toFixed(1);
    const lifetimeCarbon = (finalTreeCount * 0.5).toFixed(1);

    data.recommendations.carbonAnalysis.annualCarbonSequestration = annualCarbon;
    data.recommendations.carbonAnalysis.lifetimeCarbonSequestration = lifetimeCarbon;

    // Calculate pollution reduction based on tree count
    const reductionPercent = Math.min(35, Math.max(20, Math.round((finalTreeCount / 10000) * 2)));
    data.recommendations.carbonAnalysis.airPollutionReduction = `${reductionPercent}%`;
  }

  // Recalculate projected AQI
  if (data.recommendations.comparison && data.recommendations.comparison.after) {
    const improvementFactor = Math.min(0.3, (finalTreeCount / 100000) * 0.3);
    const projectedAQI = Math.max(0, Math.round(currentAQI * (1 - improvementFactor)));
    data.recommendations.comparison.after.aqi = projectedAQI.toString();

    const improvementPercent = Math.round(improvementFactor * 100);
    data.recommendations.comparison.improvement = `${improvementPercent}%`;

    // Set PM reduction percentages
    const pmReduction = Math.min(35, Math.max(20, improvementPercent));
    data.recommendations.comparison.after.pm25 = `${pmReduction}% reduction`;
    data.recommendations.comparison.after.pm10 = `${pmReduction}% reduction`;
  }

  // Recalculate maintenance (5% of investment)
  if (data.recommendations.implementation) {
    const investmentNum = parseInt(String(data.recommendations.investmentAmount).replace(/₹|,|Rs|INR/gi, '')) || calculatedInvestment;
    const maintenance = Math.round(investmentNum * 0.05);
    data.recommendations.implementation.maintenance = `₹${maintenance.toLocaleString('en-IN')}`;
  }

  // Ensure hourly forecast exists and is valid
  if (!data.hourlyForecast || !Array.isArray(data.hourlyForecast) || data.hourlyForecast.length === 0) {
    const hours = ['1h', '2h', '3h', '4h', '5h'];
    data.hourlyForecast = hours.map((h, i) => {
      const variation = Math.round((Math.random() - 0.5) * 20); // +/- 10
      const hourAqi = Math.max(0, currentAQI + variation);
      return {
        time: `${i + 1} hour${i > 0 ? 's' : ''} from now`,
        aqi: hourAqi,
        level: getAQILabel(hourAqi)
      };
    });
  }

  // Helper to get labels if needed during validation
  function getAQILabel(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  return data;
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
 * Uses the same calculation rules as the main prompt
 */
function createFallbackRecommendation(aqiData) {
  const currentAQI = aqiData.aqi || 100;

  // Calculate trees based on AQI using the same formula as the prompt
  let treesNeeded;
  if (currentAQI <= 50) {
    treesNeeded = Math.round((currentAQI * 50 + currentAQI * 100) / 2);
  } else if (currentAQI <= 100) {
    treesNeeded = Math.round((currentAQI * 100 + currentAQI * 150) / 2);
  } else if (currentAQI <= 150) {
    treesNeeded = Math.round((currentAQI * 150 + currentAQI * 200) / 2);
  } else if (currentAQI <= 200) {
    treesNeeded = Math.round((currentAQI * 200 + currentAQI * 250) / 2);
  } else if (currentAQI <= 300) {
    treesNeeded = Math.round((currentAQI * 250 + currentAQI * 300) / 2);
  } else {
    treesNeeded = Math.round((currentAQI * 300 + currentAQI * 350) / 2);
  }

  const costPerTree = 4000; // ₹4000 per tree average in Indian Rupees
  const investment = treesNeeded * costPerTree; // Total investment in INR

  // Calculate projected AQI based on tree count
  const improvementFactor = Math.min(0.3, (treesNeeded / 100000) * 0.3);
  const projectedAQI = Math.max(0, Math.round(currentAQI * (1 - improvementFactor)));
  const improvementPercent = Math.round(improvementFactor * 100);

  const hours = ['1h', '2h', '3h', '4h', '5h'];
  const hourlyForecast = hours.map((h, i) => {
    const variation = Math.round((Math.random() - 0.5) * 20);
    const hourAqi = Math.max(0, currentAQI + variation);
    return {
      time: `${i + 1} hour${i > 0 ? 's' : ''} from now`,
      aqi: hourAqi,
      level: getAQILabel(hourAqi)
    };
  });

  function getAQILabel(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  return {
    summary: `Current air quality in ${aqiData.city} shows an AQI of ${currentAQI}. Tree planting can significantly improve air quality. Based on environmental research, planting ${treesNeeded} trees can reduce air pollution by 25-35% over 5 years.`,
    hourlyForecast,
    recommendations: {
      treeTypes: ['Neem', 'Peepal', 'Banyan', 'Mango', 'Jamun', 'Gulmohar'],
      numberOfTrees: treesNeeded.toString(),
      investmentAmount: `₹${investment.toLocaleString('en-IN')}`,
      roi: {
        timeframe: '5-7 years',
        benefits: 'Improved air quality, reduced healthcare costs, increased property values, carbon sequestration, and environmental benefits.',
      },
      carbonAnalysis: {
        annualCarbonSequestration: `${(treesNeeded * 0.025).toFixed(1)}`,
        lifetimeCarbonSequestration: `${(treesNeeded * 0.5).toFixed(1)}`,
        airPollutionReduction: `${Math.min(35, Math.max(20, Math.round((treesNeeded / 10000) * 2)))}%`,
      },
      comparison: {
        before: {
          aqi: currentAQI,
          pm25: aqiData.pm25 || 0,
          pm10: aqiData.pm10 || 0,
          description: 'Current air quality status',
        },
        after: {
          aqi: projectedAQI.toString(),
          pm25: `${improvementPercent}% reduction`,
          pm10: `${improvementPercent}% reduction`,
          description: 'Expected improvement after 5 years of tree planting',
        },
        improvement: `${improvementPercent}%`,
      },
      humanImpact: {
        healthBenefit: "Decrease in respiratory diseases and heat-related illnesses.",
        economicBenefit: `Estimated healthcare savings of ₹${Math.round(investment * 0.2).toLocaleString('en-IN')} over 10 years.`
      },
      implementation: {
        phases: [
          'Phase 1: Site preparation and initial planting (Year 1) - Focus on high-pollution areas',
          'Phase 2: Expansion and maintenance (Years 2-3) - Expand coverage and establish care routines',
          'Phase 3: Full ecosystem establishment (Years 4-5) - Mature trees providing maximum benefits',
        ],
        timeline: '5 years',
        maintenance: `₹${Math.round(investment * 0.05).toLocaleString('en-IN')}`,
      },
    },
  };
}
