# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.60.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.60.0/claudebrowser-macos-arm64"
    sha256 "a91bbc58bbf6fe36c305d1030a176b6d5305a0b1c75007a3f946576bcd0e0159"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.60.0/claudebrowser-macos-x64"
    sha256 "25523c915888f83e0082f19f226ceaf27db7f0d23769630a5e7106dfe1cb84bb"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
