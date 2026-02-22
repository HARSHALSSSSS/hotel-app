// Dynamic Expo config. Uses MapLibre + OpenStreetMap - no Google, no API key.
const appJson = require("./app.json");

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    plugins: [...(appJson.expo.plugins || []), "@maplibre/maplibre-react-native"],
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android?.config || {}),
      },
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios?.config || {}),
      },
      infoPlist: {
        ...(appJson.expo?.ios?.infoPlist || {}),
        // For Razorpay UPI intent (PhonePe, GPay, Paytm) on iOS
        LSApplicationQueriesSchemes: ["tez", "phonepe", "paytmmp"],
      },
    },
  },
};
