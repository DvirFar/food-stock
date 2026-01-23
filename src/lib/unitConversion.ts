// Unit conversion utilities for comparing recipe ingredients with product inventory

// Unit type categories
type UnitCategory = 'volume' | 'weight' | 'count' | 'unknown';

// Base units (ml for volume, g for weight, units for count)
const unitMappings: Record<string, { category: UnitCategory; toBase: number }> = {
  // Volume units (base: ml)
  'ml': { category: 'volume', toBase: 1 },
  'מ"ל': { category: 'volume', toBase: 1 },
  'מיליליטר': { category: 'volume', toBase: 1 },
  'l': { category: 'volume', toBase: 1000 },
  'L': { category: 'volume', toBase: 1000 },
  'ל': { category: 'volume', toBase: 1000 },
  'ליטר': { category: 'volume', toBase: 1000 },
  'כוס': { category: 'volume', toBase: 240 },
  'כוסות': { category: 'volume', toBase: 240 },
  'cup': { category: 'volume', toBase: 240 },
  'cups': { category: 'volume', toBase: 240 },
  'כף': { category: 'volume', toBase: 15 },
  'כפות': { category: 'volume', toBase: 15 },
  'tbsp': { category: 'volume', toBase: 15 },
  'כפית': { category: 'volume', toBase: 5 },
  'כפיות': { category: 'volume', toBase: 5 },
  'tsp': { category: 'volume', toBase: 5 },
  
  // Weight units (base: g)
  'g': { category: 'weight', toBase: 1 },
  'gr': { category: 'weight', toBase: 1 },
  'גרם': { category: 'weight', toBase: 1 },
  "ג'": { category: 'weight', toBase: 1 },
  'גר': { category: 'weight', toBase: 1 },
  'kg': { category: 'weight', toBase: 1000 },
  'ק"ג': { category: 'weight', toBase: 1000 },
  'קילו': { category: 'weight', toBase: 1000 },
  'קילוגרם': { category: 'weight', toBase: 1000 },
  
  // Count units (base: units)
  'יחידה': { category: 'count', toBase: 1 },
  'יחידות': { category: 'count', toBase: 1 },
  'units': { category: 'count', toBase: 1 },
  'unit': { category: 'count', toBase: 1 },
  'pcs': { category: 'count', toBase: 1 },
  'pc': { category: 'count', toBase: 1 },
  'חבילה': { category: 'count', toBase: 1 },
  'חבילות': { category: 'count', toBase: 1 },
  'pack': { category: 'count', toBase: 1 },
  'packs': { category: 'count', toBase: 1 },
  'ביצה': { category: 'count', toBase: 1 },
  'ביצים': { category: 'count', toBase: 1 },
};

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

function getUnitInfo(unit: string): { category: UnitCategory; toBase: number } {
  const normalized = normalizeUnit(unit);
  return unitMappings[normalized] || unitMappings[unit] || { category: 'unknown', toBase: 1 };
}

/**
 * Convert a quantity from one unit to base units
 */
function toBaseUnits(quantity: number, unit: string): { value: number; category: UnitCategory } {
  const info = getUnitInfo(unit);
  return {
    value: quantity * info.toBase,
    category: info.category,
  };
}

/**
 * Parse a quantity string that might contain fractions or ranges
 */
export function parseQuantity(quantityStr: string | number | undefined): number {
  if (quantityStr === undefined || quantityStr === null || quantityStr === '') {
    return 0;
  }
  
  if (typeof quantityStr === 'number') {
    return quantityStr;
  }
  
  // Handle fractions like "1/2" or "1 1/2"
  const fractionMatch = quantityStr.match(/^(\d+)?\s*(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1]) : 0;
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    return whole + numerator / denominator;
  }
  
  // Handle ranges like "2-3" - take the average
  const rangeMatch = quantityStr.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
  }
  
  // Try to parse as a number
  const parsed = parseFloat(quantityStr.replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export interface IngredientAvailability {
  ingredientName: string;
  requiredQuantity: number;
  requiredUnit: string;
  availableQuantity: number;
  availableUnit: string;
  isAvailable: boolean;
  matchedProduct: string | null;
  percentageAvailable: number;
}

/**
 * Check if a product name matches an ingredient name
 * Uses fuzzy matching to handle variations
 */
function isNameMatch(productName: string, ingredientName: string): boolean {
  const normalizedProduct = productName.trim().toLowerCase();
  const normalizedIngredient = ingredientName.trim().toLowerCase();
  
  // Exact match
  if (normalizedProduct === normalizedIngredient) return true;
  
  // One contains the other
  if (normalizedProduct.includes(normalizedIngredient) || 
      normalizedIngredient.includes(normalizedProduct)) {
    return true;
  }
  
  // Check if words overlap significantly
  const productWords = normalizedProduct.split(/\s+/);
  const ingredientWords = normalizedIngredient.split(/\s+/);
  
  const matchingWords = productWords.filter(pw => 
    ingredientWords.some(iw => pw === iw || pw.includes(iw) || iw.includes(pw))
  );
  
  // If more than half the words match, consider it a match
  return matchingWords.length >= Math.min(productWords.length, ingredientWords.length) * 0.5 && matchingWords.length > 0;
}

/**
 * Compare ingredient requirements with available products
 */
export function checkIngredientAvailability(
  ingredientName: string,
  requiredQuantity: number | string | undefined,
  requiredUnit: string,
  products: Array<{ name: string; quantity: number; unit: string }>
): IngredientAvailability {
  const parsedRequired = parseQuantity(requiredQuantity);
  
  // Find matching products
  const matchingProducts = products.filter(p => isNameMatch(p.name, ingredientName));
  
  if (matchingProducts.length === 0) {
    return {
      ingredientName,
      requiredQuantity: parsedRequired,
      requiredUnit,
      availableQuantity: 0,
      availableUnit: requiredUnit,
      isAvailable: false,
      matchedProduct: null,
      percentageAvailable: 0,
    };
  }
  
  // Sum up quantities from matching products (convert to base units if possible)
  const requiredBase = toBaseUnits(parsedRequired, requiredUnit);
  
  let totalAvailableBase = 0;
  let bestMatch = matchingProducts[0];
  
  for (const product of matchingProducts) {
    const productBase = toBaseUnits(product.quantity, product.unit);
    
    // Only add if units are compatible
    if (productBase.category === requiredBase.category) {
      totalAvailableBase += productBase.value;
    } else if (requiredBase.category === 'unknown' || productBase.category === 'unknown') {
      // If units are unknown, compare directly
      totalAvailableBase += product.quantity;
    }
    
    if (product.quantity > bestMatch.quantity) {
      bestMatch = product;
    }
  }
  
  const percentageAvailable = requiredBase.value > 0 
    ? Math.min((totalAvailableBase / requiredBase.value) * 100, 100)
    : (matchingProducts.length > 0 ? 100 : 0);
  
  return {
    ingredientName,
    requiredQuantity: parsedRequired,
    requiredUnit,
    availableQuantity: bestMatch.quantity,
    availableUnit: bestMatch.unit,
    isAvailable: percentageAvailable >= 100 || (parsedRequired === 0 && matchingProducts.length > 0),
    matchedProduct: bestMatch.name,
    percentageAvailable,
  };
}
