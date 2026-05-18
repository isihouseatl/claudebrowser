# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.2.2"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.2/claudebrowser-macos-arm64"
    sha256 "c7d6efc555395d088d5120bc6041386e134293e8cc4351fc997ceb519472eb2a"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.2/claudebrowser-macos-x64"
    sha256 "d7505e2ee4fc663ac15d1a8445376b14f103657dddeab87e1b3db75a5daa8ff7"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
