# fitplan development environment
# Source this before running npm / gradle / adb:  source tools/env.sh
export JAVA_HOME="$HOME/.local/opt/jdk17"
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/.local/opt/node/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# Development builds compile native code only for the plugged-in phone
# (arm64). Release builds must unset this so every architecture is included.
export ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a
