# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.51.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.51.0/claudebrowser-macos-arm64"
    sha256 "78fd616cea3276d4b7e8038fd32e681c5ce93f4ec241facef7ef612f780e7ed3"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.51.0/claudebrowser-macos-x64"
    sha256 "699b458a5bb2e36c44eb68cfd9063a7e78d6e39d19e38bc3cd29ece2f7a59f0a"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
