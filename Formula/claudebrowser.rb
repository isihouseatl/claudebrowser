# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.69.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.69.0/claudebrowser-macos-arm64"
    sha256 "5b5b3c27b44fe232dc02a2b56963b173d61abfbfb08c35d48c3eea2d8d2e3e30"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.69.0/claudebrowser-macos-x64"
    sha256 "0e434e8e016d60efae0e1e81b7672358444587b9707928b82151d80c2efb5d3c"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
