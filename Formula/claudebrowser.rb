# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.14.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.14.0/claudebrowser-macos-arm64"
    sha256 "4f7ee9e9e6387a3d431c9f3dbbc9563244f30460f4e96dffe85fa0b0153a00f2"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.14.0/claudebrowser-macos-x64"
    sha256 "2862750295c9746c0ad9a932e5cdf581f60f2bacc5a9591feb8c4e4f8cbe77ea"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
