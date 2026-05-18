# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.15.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.15.0/claudebrowser-macos-arm64"
    sha256 "0d3f5bffb3b829e246bf31ba976a879e27f863926ba89ff44cd2d728555a7e2e"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.15.0/claudebrowser-macos-x64"
    sha256 "bfd356874d64f790f94249fd712c972840198885b1879dd1919a2d35861789fb"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
