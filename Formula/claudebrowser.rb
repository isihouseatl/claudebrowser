# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.47.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.47.0/claudebrowser-macos-arm64"
    sha256 "337c8109c7f2f856b727a9c4be6821a79bb994eb9fc5ccfefd6ca9fa299cb9fc"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.47.0/claudebrowser-macos-x64"
    sha256 "c5be79c623256b6a0252c82461ae566cbeb906966d9ad697c8803c85f9521a9e"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
