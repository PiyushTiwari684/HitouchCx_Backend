/**
 * Location and IP Tracking Utilities
 * Captures user's location and IP address for proctoring
 */

/**
 * Get user's IP address using ipapi.co
 * @returns {Promise<Object>} IP address and location data
 */
export async function getIPAddress() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch IP address');
    }

    const data = await response.json();
    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      countryCode: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org
    };
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return null;
  }
}

/**
 * Get user's geolocation using browser Geolocation API
 * @returns {Promise<Object>} Location data
 */
export function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Geolocation permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Geolocation request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Get combined location data (IP + Geolocation)
 * @returns {Promise<Object>} Combined location data
 */
export async function getCombinedLocationData() {
  try {
    const [ipData, geoData] = await Promise.allSettled([
      getIPAddress(),
      getGeolocation()
    ]);

    const result = {
      timestamp: new Date().toISOString(),
      ip: null,
      geolocation: null,
      errors: []
    };

    if (ipData.status === 'fulfilled' && ipData.value) {
      result.ip = ipData.value;
    } else {
      result.errors.push({
        type: 'ip',
        message: ipData.reason?.message || 'Failed to get IP'
      });
    }

    if (geoData.status === 'fulfilled' && geoData.value) {
      result.geolocation = geoData.value;
    } else {
      result.errors.push({
        type: 'geolocation',
        message: geoData.reason?.message || 'Failed to get geolocation'
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting combined location data:', error);
    return {
      timestamp: new Date().toISOString(),
      ip: null,
      geolocation: null,
      errors: [{ type: 'combined', message: error.message }]
    };
  }
}

/**
 * Compare two IP addresses
 * @param {string} ip1 - First IP address
 * @param {string} ip2 - Second IP address
 * @returns {boolean} True if IPs are different
 */
export function hasIPChanged(ip1, ip2) {
  if (!ip1 || !ip2) return false;
  return ip1 !== ip2;
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if location has changed significantly
 * @param {Object} loc1 - First location
 * @param {Object} loc2 - Second location
 * @param {number} threshold - Distance threshold in km (default: 1km)
 * @returns {boolean} True if location changed significantly
 */
export function hasLocationChanged(loc1, loc2, threshold = 1) {
  if (!loc1 || !loc2) return false;
  if (!loc1.latitude || !loc1.longitude || !loc2.latitude || !loc2.longitude) {
    return false;
  }

  const distance = calculateDistance(
    loc1.latitude,
    loc1.longitude,
    loc2.latitude,
    loc2.longitude
  );

  return distance > threshold;
}

/**
 * Monitor IP and location changes
 * @param {Object} initialData - Initial location data
 * @param {Function} onIPChange - Callback when IP changes
 * @param {Function} onLocationChange - Callback when location changes
 * @param {number} interval - Check interval in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Cleanup function
 */
export function monitorLocationChanges(
  initialData,
  onIPChange,
  onLocationChange,
  interval = 60000
) {
  const intervalId = setInterval(async () => {
    try {
      const currentData = await getCombinedLocationData();

      // Check IP change
      if (
        initialData.ip &&
        currentData.ip &&
        hasIPChanged(initialData.ip.ip, currentData.ip.ip)
      ) {
        onIPChange(currentData.ip, initialData.ip);
      }

      // Check location change
      if (
        initialData.geolocation &&
        currentData.geolocation &&
        hasLocationChanged(initialData.geolocation, currentData.geolocation)
      ) {
        onLocationChange(currentData.geolocation, initialData.geolocation);
      }
    } catch (error) {
      console.error('Error monitoring location changes:', error);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
