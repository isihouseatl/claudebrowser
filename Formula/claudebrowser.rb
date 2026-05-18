# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.25.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.25.0/claudebrowser-macos-arm64"
    sha256 "fa830c6d8e99006702c3a55df4d9d2167c2e7b7d86fb171fc6fd99038bde1dd3"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.25.0/claudebrowser-macos-x64"
    sha256 "a298e27a493eb0b1231541abcd26e9eb6e4014d3e1e2089adc8ae674ec28b89d"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
