# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.75.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.75.0/claudebrowser-macos-arm64"
    sha256 "5478c15ced614f24334a3958402fdbe06a90f62af60b5e96986a86d3e7c85b5e"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.75.0/claudebrowser-macos-x64"
    sha256 "5644c6c3905a9e0dabd42a80e642f17cae7d954d801953bc82dab752bc9a3343"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
