export default {
  expo: {
    name: "Foundly",           // App display name
    slug: "foundly",           // Project slug
    scheme: "foundly",         // Linking scheme
    version: "1.0.0",
    platforms: ["ios", "android", "web"],
    extra: {
      mockApi: process.env.EXPO_BASE_URL,
    },
    ios: {
      bundleIdentifier: "com.yourname.foundly",
      supportsTablet: true,
    },
    android: {
      package: "com.yourname.foundly",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
  },
};
