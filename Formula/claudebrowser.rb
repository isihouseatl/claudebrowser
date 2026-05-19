# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.54.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.54.0/claudebrowser-macos-arm64"
    sha256 "23452bc1615163bcbbb67f04168c92e1970cbc9f0bc93ff5019442b75ed8579d"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.54.0/claudebrowser-macos-x64"
    sha256 "85fe76f55254a3fa0af6f73d4e7bf9fb11db3fae3e00cce64f0d1be4de7d2246"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
