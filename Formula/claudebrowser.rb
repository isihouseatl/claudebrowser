# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.55.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.55.0/claudebrowser-macos-arm64"
    sha256 "d48ebd4eb9cc226e9dc1826f0130ae0b9c63c62084b5d6c352e748531f006f99"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.55.0/claudebrowser-macos-x64"
    sha256 "17ad1ccccd0db34366d279178d213861a7809c8ddfc7a1ccfea1e19da4e8101c"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
