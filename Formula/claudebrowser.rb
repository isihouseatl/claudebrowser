# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.82.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.82.0/claudebrowser-macos-arm64"
    sha256 "1299a806612941c3c792d5edb792356d8574fffe47e58664ff7d09d104f54681"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.82.0/claudebrowser-macos-x64"
    sha256 "4b1c0bb9a0536cd4444a5bea33fbc82baa6ee578420d6c935aa3797e7b19d819"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
