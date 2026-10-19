# Сборка подписанного .aab для Google Play.
# Требуется: JDK 21, Android SDK (ANDROID_HOME), android/keystore.properties
$ErrorActionPreference = 'Stop'
if (-not (Test-Path android/keystore.properties)) { throw 'Нет android/keystore.properties (см. keystore.properties.example)' }
npm ci
npm run build
npx cap sync android
Push-Location android
./gradlew.bat clean bundleRelease
Pop-Location
Write-Host "AAB: android/app/build/outputs/bundle/release/app-release.aab"
