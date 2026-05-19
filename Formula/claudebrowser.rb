# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.71.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.71.0/claudebrowser-macos-arm64"
    sha256 "43ecfe2699e6a2fdeef663ce09cbe331a0e994eebe46a47b8f5f416473a49ba5"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.71.0/claudebrowser-macos-x64"
    sha256 "9bf1fd5bcef76e5a69fbed1e9ef44a9fdd748cf592f65cb7987abd392f01a49d"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
