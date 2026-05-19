# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.73.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.73.0/claudebrowser-macos-arm64"
    sha256 "b700976f56765348d5d92f4ac72915e96d33fd7b263071aae74e4f7866120fa8"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.73.0/claudebrowser-macos-x64"
    sha256 "d970efb1ab0eb835a488ccb3e203b01cbe6660710f804ff167bb13b40d891009"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
