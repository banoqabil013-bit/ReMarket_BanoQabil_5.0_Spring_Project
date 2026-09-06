/**
 * Live Geolocation and Reverse Geocoding Utility
 * Supports mobile GPS, laptop WiFi/GPS, with automatic IP-based fallback.
 */

const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export const getCachedCity = () => {
  try {
    return localStorage.getItem("detected_city") || "";
  } catch {
    return "";
  }
};

export const getLiveLocation = async () => {
  // Helper to fetch reverse geocode
  const fetchAddress = async (lat = null, lon = null) => {
    let url = `${REVERSE_GEOCODE_URL}?localityLanguage=en`;
    if (lat !== null && lon !== null) {
      url += `&latitude=${lat}&longitude=${lon}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geocoding failed with status: ${res.status}`);
    }

    const data = await res.json();
    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.countryName ||
      "";

    const cleanCity = String(city).trim();

    if (cleanCity) {
      try {
        localStorage.setItem("detected_city", cleanCity);
      } catch {
        // ignore localStorage errors in private mode
      }
    }

    return {
      success: true,
      city: cleanCity,
      locality: data.locality || "",
      state: data.principalSubdivision || "",
      country: data.countryName || "",
      latitude: lat,
      longitude: lon,
    };
  };

  // 1. Try Browser HTML5 Geolocation (GPS on mobile / WiFi on laptop)
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 120000,
        });
      });

      const { latitude, longitude } = position.coords;
      return await fetchAddress(latitude, longitude);
    } catch (gpsError) {
      console.warn("GPS Geolocation unavailable or denied, falling back to network IP location:", gpsError.message);
    }
  }

  // 2. Fallback to IP-based Geolocation if GPS is denied, timed out, or unavailable
  try {
    return await fetchAddress();
  } catch (fallbackError) {
    console.error("Network location fallback failed:", fallbackError);
    return {
      success: false,
      city: getCachedCity() || "Karachi",
      error: fallbackError.message,
    };
  }
};
