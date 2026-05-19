# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.80.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.80.0/claudebrowser-macos-arm64"
    sha256 "6f226504ce0ae287ab88d010558deea6f768a4d6422d108bb5ec1fa074c9f5e7"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.80.0/claudebrowser-macos-x64"
    sha256 "e405f5a7bf410ec30d521dc4c893501635b02798906f382b35e59b8651dc45de"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
