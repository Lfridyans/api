// Script untuk menganalisis scenario yang diterapkan pada prediksi
// Usage: node scripts/analyze-scenarios.js

const fs = require('fs');
const path = require('path');

// Helper untuk menentukan periode promo
function isWithinPromoPeriod(dateString) {
  const date = new Date(dateString);
  const promoStart = new Date('2025-12-22');
  const promoEnd = new Date('2026-01-10');
  return date >= promoStart && date <= promoEnd;
}

// Analisis scenario dari hasil prediksi
function analyzeScenarios(predictions) {
  const analysis = {
    totalDates: predictions.length,
    scenarios: {},
    promoPeriod: {
      dates: [],
      count: 0
    },
    highDemandEvents: {
      dates: [],
      count: 0
    },
    normalOperations: {
      dates: [],
      count: 0
    },
    weatherDisruption: {
      dates: [],
      count: 0
    },
    combinedScenarios: {
      promoAndEvent: [],
      count: 0
    }
  };

  predictions.forEach(pred => {
    const scenario = pred.appliedScenario || 'Unknown';
    const date = pred.date;
    
    // Count scenarios
    if (!analysis.scenarios[scenario]) {
      analysis.scenarios[scenario] = { count: 0, dates: [] };
    }
    analysis.scenarios[scenario].count++;
    analysis.scenarios[scenario].dates.push(date);

    // Check promo period
    if (isWithinPromoPeriod(date)) {
      analysis.promoPeriod.dates.push(date);
      analysis.promoPeriod.count++;
    }

    // Categorize
    if (scenario.includes('Promo') || scenario.includes('promo')) {
      analysis.promoPeriod.dates.push(date);
    }
    if (scenario.includes('High Demand') || scenario.includes('Event')) {
      analysis.highDemandEvents.dates.push(date);
      analysis.highDemandEvents.count++;
    }
    if (scenario.includes('Normal')) {
      analysis.normalOperations.dates.push(date);
      analysis.normalOperations.count++;
    }
    if (scenario.includes('Weather')) {
      analysis.weatherDisruption.dates.push(date);
      analysis.weatherDisruption.count++;
    }

    // Check if date has both promo period AND high demand event
    if (isWithinPromoPeriod(date) && (scenario.includes('High Demand') || scenario.includes('Event'))) {
      analysis.combinedScenarios.promoAndEvent.push({
        date,
        scenario,
        detectedEvent: pred.detectedEvent
      });
      analysis.combinedScenarios.count++;
    }
  });

  return analysis;
}

// Calculate growth breakdown
function calculateGrowthBreakdown(predictions, baselineData) {
  const baselineTotal = baselineData.reduce((sum, d) => sum + d.passengers, 0);
  const forecastTotal = predictions.reduce((sum, p) => sum + p.predictedValue, 0);
  const growth = ((forecastTotal - baselineTotal) / baselineTotal) * 100;

  // Calculate average adjustment per scenario
  const scenarioAdjustments = {};
  predictions.forEach(pred => {
    const scenario = pred.appliedScenario || 'Unknown';
    const baselineDate = getBaselineDate(pred.date);
    const baselineValue = baselineData.find(d => d.date === baselineDate)?.passengers || 0;
    
    if (baselineValue > 0) {
      const adjustment = ((pred.predictedValue - baselineValue) / baselineValue) * 100;
      
      if (!scenarioAdjustments[scenario]) {
        scenarioAdjustments[scenario] = { adjustments: [], count: 0 };
      }
      scenarioAdjustments[scenario].adjustments.push(adjustment);
      scenarioAdjustments[scenario].count++;
    }
  });

  // Calculate average
  Object.keys(scenarioAdjustments).forEach(scenario => {
    const avg = scenarioAdjustments[scenario].adjustments.reduce((a, b) => a + b, 0) / scenarioAdjustments[scenario].adjustments.length;
    scenarioAdjustments[scenario].average = avg;
    scenarioAdjustments[scenario].min = Math.min(...scenarioAdjustments[scenario].adjustments);
    scenarioAdjustments[scenario].max = Math.max(...scenarioAdjustments[scenario].adjustments);
  });

  return {
    baselineTotal,
    forecastTotal,
    growth,
    scenarioAdjustments
  };
}

function getBaselineDate(predictionDate) {
  const date = new Date(predictionDate);
  if (date.getFullYear() === 2025) {
    date.setFullYear(2024);
  } else if (date.getFullYear() === 2026) {
    date.setFullYear(2024);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('=== ANALISIS SCENARIO PREDIKSI ===\n');
console.log('Script ini menganalisis hasil prediksi untuk melihat:');
console.log('1. Berapa hari yang mendapat "Promo Ticket Boost"');
console.log('2. Berapa hari yang mendapat "High Demand Event"');
console.log('3. Apakah adjustment diakumulasi atau hanya salah satu');
console.log('4. Rekomendasi normalisasi jika diperlukan\n');
console.log('Untuk menggunakan script ini, perlu data hasil prediksi.');
console.log('Script ini akan diintegrasikan ke dalam sistem untuk analisis real-time.\n');


