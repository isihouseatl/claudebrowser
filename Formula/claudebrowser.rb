# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.2.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.0/claudebrowser-macos-arm64"
    sha256 "236b7810a0eff85083fe77d328a11b2f3827f89979f2ce379987bce03f9e28d4"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.0/claudebrowser-macos-x64"
    sha256 "da200d678251f0161e9bcb0ff88b0b3c65800d336dfbed04a6570cc2ff71c5a6"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
