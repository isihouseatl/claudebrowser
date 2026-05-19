# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.70.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.70.0/claudebrowser-macos-arm64"
    sha256 "7bcc9533578677d20abddbd2dc641f7bffc831f7a93697036fbf1c134d5839c7"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.70.0/claudebrowser-macos-x64"
    sha256 "f3f9f7d18a2a24388f3fdb131a7db22b363b2c995358a95de0d5317ed7976245"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
