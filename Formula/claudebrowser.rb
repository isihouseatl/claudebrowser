# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.64.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.64.0/claudebrowser-macos-arm64"
    sha256 "ca76fb3e543ab5997ef59e5d2a96b9817e1e36ca023995d3c51d2ac708872955"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.64.0/claudebrowser-macos-x64"
    sha256 "c13e85e69c49fd81636b3aa986658459a352c7cb22e23776699c28ed8fe85f80"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
