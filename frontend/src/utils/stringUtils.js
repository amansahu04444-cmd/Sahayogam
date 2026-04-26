/**
 * Safely converts any value to a lowercase string.
 * This prevents crashes when trying to map or filter over
 * complex objects (like location data from Firebase) that aren't purely strings.
 * 
 * @param {any} val - The incoming value to be stringified and lowercased
 * @returns {string} The safe lowercase string
 */
export const safeLower = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase();
};
