# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.59.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.59.0/claudebrowser-macos-arm64"
    sha256 "e5b3386cb10e7bec1c7a749ca4a43b14d989805386e9d37d7d6cb43eb85ca8e5"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.59.0/claudebrowser-macos-x64"
    sha256 "d5ca7465624733ea3f71e44086d8658f0b3c6177596ad5c29be734f52ebf483d"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
