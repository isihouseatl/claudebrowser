# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.29.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.29.0/claudebrowser-macos-arm64"
    sha256 "83de99b01ebeca417596fc5476a01fc8eaab19aa5cad28e5fb23dec7c89812e2"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.29.0/claudebrowser-macos-x64"
    sha256 "8458384ab797f66c453a17ae9e4732bf6c7886bc093d328d614e1dba11bf2e70"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
