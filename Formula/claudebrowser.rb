# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.78.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.78.0/claudebrowser-macos-arm64"
    sha256 "34f36ef29269da8711bd772785bb98cf85cc1d9754ad6daec8ab5317a377167f"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.78.0/claudebrowser-macos-x64"
    sha256 "35ca7755f021f4c2ef4e95fec7e30bc9a89a74ed625251c195b74e144c87e0a5"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
