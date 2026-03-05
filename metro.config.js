const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve react-dom to react-native for compatibility
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-dom' && platform !== 'web') {
    return {
      filePath: require.resolve('react-native'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
