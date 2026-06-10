// Helper to compute standard normal cumulative distribution (CDF)
// Approximation of erf(x) to compute p-values
function normalCDF(z) {
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2.0);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0.0 ? 1.0 - p : p;
}

// Compute A/B test statistics using a two-proportion Z-test
export const calculateABStats = (variants) => {
  if (!variants || !variants.a || !variants.b) {
    return {
      pValue: 0.5,
      confidence: 0,
      isSignificant: false,
      lift: 0,
      confidenceInterval: [0, 0],
      winner: 'Draw'
    };
  }
  const { a, b } = variants;
  if (a.sent === 0 || b.sent === 0) {
    return {
      pValue: 0.5,
      confidence: 0,
      isSignificant: false,
      lift: 0,
      confidenceInterval: [0, 0],
      winner: 'Draw'
    };
  }

  // Conversion rates
  const pA = a.clicks / a.sent;
  const pB = b.clicks / b.sent;

  // Lift
  const lift = pA > 0 ? ((pB - pA) / pA) * 100 : 0;

  // Standard errors
  const seA = Math.sqrt((pA * (1 - pA)) / a.sent);
  const seB = Math.sqrt((pB * (1 - pB)) / b.sent);

  // Pooled proportion
  const pooledP = (a.clicks + b.clicks) / (a.sent + b.sent);
  const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1 / a.sent + 1 / b.sent));

  // Z-Score
  const zScore = pooledSE > 0 ? (pB - pA) / pooledSE : 0;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  const confidence = (1 - pValue) * 100;
  const isSignificant = confidence >= 95;

  // 95% Confidence interval for the difference (pB - pA)
  const marginError = 1.96 * Math.sqrt(seA * seA + seB * seB);
  const diff = pB - pA;
  const ciLow = (diff - marginError) * 100;
  const ciHigh = (diff + marginError) * 100;

  let winner = 'Draw';
  if (isSignificant) {
    winner = pB > pA ? 'Challenger' : 'Baseline';
  }

  return {
    pValue: parseFloat(pValue.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(2)),
    isSignificant,
    lift: parseFloat(lift.toFixed(2)),
    confidenceInterval: [parseFloat(ciLow.toFixed(2)), parseFloat(ciHigh.toFixed(2))],
    winner
  };
};

// Generates an SVG path string for a normal distribution curve
export const generateNormalCurvePath = (mean, stdDev, width = 400, height = 150) => {
  if (stdDev <= 0) return '';
  
  const points = [];
  const minX = mean - 3 * stdDev;
  const maxX = mean + 3 * stdDev;
  const rangeX = maxX - minX;

  for (let i = 0; i <= 100; i++) {
    const pct = i / 100;
    const xVal = minX + pct * rangeX;
    
    // Normal PDF formula
    const exponent = -0.5 * Math.pow((xVal - mean) / stdDev, 2);
    const yVal = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

    // Map to SVG coordinates
    const svgX = pct * width;
    
    // Height normalization scaling
    const maxDensity = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const normalizedY = yVal / maxDensity;
    const svgY = height - normalizedY * (height - 20) - 5; // keep padding

    points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
  }

  return `M ${points[0]} ${points.slice(1).map(p => `L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;
};

// Compute standard deviation for conversion rates
export const getProportionStdDev = (successes, trials) => {
  if (trials === 0) return 0;
  const p = successes / trials;
  return Math.sqrt((p * (1 - p)) / trials);
};
