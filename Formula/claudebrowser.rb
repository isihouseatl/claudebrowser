# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.1.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.1.0/claudebrowser-macos-arm64"
    sha256 "9f538058da79e095ebd3e475b635ab3c40926954aeb4bc14bd4cb73dc4d5b07d"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.1.0/claudebrowser-macos-x64"
    sha256 "189c41391a66979067bccd87481c5b1ca8329365c6b452e4b7b077a545a54003"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
