# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.8.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.8.0/claudebrowser-macos-arm64"
    sha256 "bf3205bc6a5bf072fad73efc7e54d698ef468ce539015f3b322a40f87eb7287b"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.8.0/claudebrowser-macos-x64"
    sha256 "fd18c3c57f5b28bf0a8de7413ccf74f4e129cc387e5f372da043279268f67c1b"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
