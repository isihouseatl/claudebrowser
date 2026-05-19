# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.92.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.92.0/claudebrowser-macos-arm64"
    sha256 "d87691893e2c4869fc97c7be05ce2eaa6f9203f93bcf3268d4ec3e39f094a0d5"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.92.0/claudebrowser-macos-x64"
    sha256 "5f027cf9f458a9a120e9b35a274c919c10700cdd9035a8d6e35d01a318997c9e"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
