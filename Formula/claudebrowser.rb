# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.3.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.3.0/claudebrowser-macos-arm64"
    sha256 "f74f98b616d68533899f092a55f28165ca51755a523e2f57cca9e4eaa43bd1c3"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.3.0/claudebrowser-macos-x64"
    sha256 "2a04fa468dfd92cb6915f5182acb6b94bba68ca4d4a72c4a511e728b830d45f1"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
