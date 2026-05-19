# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.48.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.48.0/claudebrowser-macos-arm64"
    sha256 "397616dff2d906207a67f2a6f07fa1dbaa57c65bccc07362a8630a8665605162"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.48.0/claudebrowser-macos-x64"
    sha256 "63cbde25d37f789fca196806d4f24c7b1d13ce910e39fd0335e995e32d357696"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
