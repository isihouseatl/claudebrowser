# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.49.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.49.0/claudebrowser-macos-arm64"
    sha256 "836ddb99a57e23c154d88f0963801c947583857ab31a589032b2205f9c6f8b6b"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.49.0/claudebrowser-macos-x64"
    sha256 "60532c737a0063591b2f29976c06864e6d74c52430efea066e69918d5cc2213e"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
