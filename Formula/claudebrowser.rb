# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.77.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.77.0/claudebrowser-macos-arm64"
    sha256 "534eec3ba4bba324f4967a61aa5818794094c8d06c274a234d37b4f3bd7a63cd"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.77.0/claudebrowser-macos-x64"
    sha256 "a8a119fcb0d3bdce1dd32132ea70f87bdbe3d1e76858fe6fc44bd9e9a17bcfdd"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
