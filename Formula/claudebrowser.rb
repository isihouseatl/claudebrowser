# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.90.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.90.0/claudebrowser-macos-arm64"
    sha256 "771935f993e6695b02e8e3116f2ad2883cc53ab47ab4f23ec768e2cb9d761e4a"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.90.0/claudebrowser-macos-x64"
    sha256 "6a225af1b93fd2fb0949e7dcced1d1d65171b613405adb559f183a5f53db1c65"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
