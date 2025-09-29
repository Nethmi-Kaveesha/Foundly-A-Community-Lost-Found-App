// Try to load nativewind's metro wrapper if available. In some build environments
// (like EAS) nativewind may not be installed in the project workspace; fall
// back to a passthrough that returns the config unchanged.
let withNativeWind
try {
	({ withNativeWind } = require("nativewind/metro"))
} catch (_err) {
	// noop passthrough: keeps signature (config, opts)
	withNativeWind = (config /*, opts */) => config
}

// Try both package names so the config works across different Expo versions/environments
let getDefaultConfig
try {
	// new package name
	({ getDefaultConfig } = require("@expo/metro-config"))
} catch (e1) {
	try {
		// older package location
		({ getDefaultConfig } = require("expo/metro-config"))
		} catch (_e2) {
		// Re-throw the original error for visibility in build logs
		throw e1
	}
}

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: "./global.css" })
