# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.85.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.85.0/claudebrowser-macos-arm64"
    sha256 "8e6dcb8ed40d08b0abfaeeea9289b2f494c7f5cc99c581487c0a597696ba2d7b"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.85.0/claudebrowser-macos-x64"
    sha256 "2d8a3806e14387348dbda0f669fb1afa5f2ef4ab6ae8dfad19010dc9f721adba"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
