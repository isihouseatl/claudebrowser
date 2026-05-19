# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.38.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.38.0/claudebrowser-macos-arm64"
    sha256 "e84c64e8941a5a017d98bd9412c12d109d6eeab4b32235ab52f5f42643d55134"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.38.0/claudebrowser-macos-x64"
    sha256 "f7d04d90d955a08b1de3dc8a027f4841a7bfd291687efceffd0529977834d8ca"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
