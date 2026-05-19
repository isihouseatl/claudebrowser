# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.66.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.66.0/claudebrowser-macos-arm64"
    sha256 "68413508b19ad8d6389afbcf72c5b0c557893fea97032fe8675fc0284f18c9bd"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.66.0/claudebrowser-macos-x64"
    sha256 "be47863ccc7f2da177b5aebbc075f0d6339a3f8e36692265e684132ef0bf68ad"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
