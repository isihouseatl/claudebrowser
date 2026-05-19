# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.62.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.62.0/claudebrowser-macos-arm64"
    sha256 "924617a9247a243498b1f68621a02b90b369e52f5ea0c3e9736ffa7b68a0f1a3"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.62.0/claudebrowser-macos-x64"
    sha256 "4349898c75a1ee932b0338ffcd83dfad1b58d3b4a36951eb5cc7c66a54150ab9"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
