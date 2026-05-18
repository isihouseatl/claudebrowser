# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.20.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.20.0/claudebrowser-macos-arm64"
    sha256 "5cde6304331ad156d668d57ff75c644579314ab9ebe718493147050725bf931f"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.20.0/claudebrowser-macos-x64"
    sha256 "9b1e1a57ab0542fb6a3cb11e06a79a98a2e5629a64d31a4898306c20db22393c"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
