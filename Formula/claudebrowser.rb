# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.32.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.32.0/claudebrowser-macos-arm64"
    sha256 "2c0bac5e2e000af2857c690425f84699fefc5cc1ba022b8576cc4698a8c33642"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.32.0/claudebrowser-macos-x64"
    sha256 "aba9ea74052ac7f0106216610efc7592530a6c79792b670d80de6bee47c82add"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
