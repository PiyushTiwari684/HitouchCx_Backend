/**
 * Array Helper Utilities
 * Provides functions for array manipulation including shuffling and random selection
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 * This algorithm ensures uniform random distribution
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array (new array, doesn't modify original)
 */
export function shuffleArray(array) {
  // Create a copy to avoid mutating original array
  const shuffled = [...array];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at indices i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Select N random items from array
 * Uses Fisher-Yates shuffle to ensure fair random selection
 * @param {Array} array - Source array
 * @param {number} count - Number of items to select
 * @returns {Array} - Random selection of items
 */
export function selectRandom(array, count) {
  if (!array || array.length === 0) {
    return [];
  }

  // Shuffle the array first
  const shuffled = shuffleArray(array);

  // Return first N items (or all items if count > array.length)
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Weighted random selection
 * Select items based on their weight (lower weight = higher chance)
 * Useful for balancing question usage - prefer less-used questions
 * @param {Array} items - Array of items with 'weight' property
 * @param {number} count - Number of items to select
 * @returns {Array} - Weighted random selection
 */
export function selectWeightedRandom(items, count) {
  if (!items || items.length === 0) {
    return [];
  }

  const selected = [];
  const pool = [...items]; // Create a copy

  for (let i = 0; i < count && pool.length > 0; i++) {
    // Calculate total weight
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);

    // Generate random number between 0 and totalWeight
    let random = Math.random() * totalWeight;

    // Select item based on weight
    for (let j = 0; j < pool.length; j++) {
      random -= (pool[j].weight || 1);
      if (random <= 0) {
        selected.push(pool[j]);
        pool.splice(j, 1); // Remove selected item from pool
        break;
      }
    }
  }

  return selected;
}

/**
 * Group array items by a key
 * @param {Array} array - Array of objects
 * @param {string} key - Key to group by
 * @returns {Object} - Object with grouped items
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}
