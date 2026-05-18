# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.5.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.5.0/claudebrowser-macos-arm64"
    sha256 "4c3645f24e7536e5db0b3e593c6ac45d87403a685bf6c1e875e79ca319140904"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.5.0/claudebrowser-macos-x64"
    sha256 "e6dd1eae258e9235bd41f5747560e02fa03f6e49361388d83f8520d22924aa47"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
