# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.17.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.17.0/claudebrowser-macos-arm64"
    sha256 "265bbc855caa7ccce648630825149369c5f024e65c0cd306dae10b90bb4e731e"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.17.0/claudebrowser-macos-x64"
    sha256 "5fa6db1f83333d69e5cf597314cc0df9c30578216206f79b1c6e73b2e2d6abc9"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
