# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.22.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.22.0/claudebrowser-macos-arm64"
    sha256 "4b069eebb28ff3109d6fd277be61f5899ecaabcfec55fd74b714192fc8362c56"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.22.0/claudebrowser-macos-x64"
    sha256 "54f0628224ee468b92d3e78f2afa1d2638b0f61880cf1b64245bdceb603b3c56"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
