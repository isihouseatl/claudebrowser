# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.26.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.26.0/claudebrowser-macos-arm64"
    sha256 "2fa4246aba0c50a13e68d9eeb96766b7c8e7a9bb26e01b6a6f372b7c9800c385"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.26.0/claudebrowser-macos-x64"
    sha256 "e15d25a5ebc96d62c2fc09ef12d3d72670c829529a98101617a92502cfca3f8f"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
