const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Two-part fix for Swift 6 strict concurrency errors and @MainActor unknown attribute:
 *
 * 1. Patches Podfile post_install to force SWIFT_VERSION = 5.9 for all pods.
 *    - expo-modules-core sets swift_version = '6.0' which enforces strict concurrency
 *    - Swift 5.9 supports @MainActor but doesn't enforce strict concurrency
 *
 * 2. Patches project.pbxproj to upgrade main app target from SWIFT_VERSION = 5.0 to 5.9.
 *    - React Native template generates SWIFT_VERSION = 5.0 for the main target
 *    - Swift 5.0 doesn't know @MainActor (introduced in 5.5), causing "unknown attribute" errors
 */
module.exports = function withSwiftConcurrencyFix(config) {
  // Step 1: patch Podfile
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('SWIFT_VERSION_OVERRIDE')) {
        const swiftFix = `    # SWIFT_VERSION_OVERRIDE: Force 5.9 to fix ExpoModulesCore Swift 6 strict concurrency errors
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |cfg|
        cfg.build_settings['SWIFT_VERSION'] = '5.9'
        cfg.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
      end
    end
    # Also patch xcconfig files that may have SWIFT_VERSION = 5.0 (overrides pbxproj in some Xcode versions)
    require 'fileutils'
    Dir.glob("#{installer.sandbox.root}/Target Support Files/**/*.xcconfig") do |xcconfig_path|
      content = File.read(xcconfig_path)
      if content.include?('SWIFT_VERSION = 5.0')
        File.write(xcconfig_path, content.gsub('SWIFT_VERSION = 5.0', 'SWIFT_VERSION = 5.9'))
      end
    end\n`;

        podfile = podfile.replace(/(\n  end\nend\n?)$/, `\n${swiftFix}  end\nend\n`);
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);

  // Step 2: patch project.pbxproj main app target Swift version
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const pbxprojPath = path.join(
        config.modRequest.platformProjectRoot,
        `${config.modRequest.projectName}.xcodeproj`,
        'project.pbxproj'
      );
      let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

      if (pbxproj.includes('SWIFT_VERSION = 5.0')) {
        pbxproj = pbxproj.replace(/SWIFT_VERSION = 5\.0;/g, 'SWIFT_VERSION = 5.9;');
        fs.writeFileSync(pbxprojPath, pbxproj);
      }

      return config;
    },
  ]);

  return config;
};
