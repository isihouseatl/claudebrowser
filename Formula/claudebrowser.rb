# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.79.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.79.0/claudebrowser-macos-arm64"
    sha256 "af8c215b21930acba2d1d2c6d163f73565d3f3f2d170bf5dfc341a005f39f5ff"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.79.0/claudebrowser-macos-x64"
    sha256 "324e557961540710b3c5e78bb79086d3a36f5dbf4b4cabd7a58ba86a75e7e13c"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
