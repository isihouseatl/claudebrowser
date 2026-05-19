# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.57.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.57.0/claudebrowser-macos-arm64"
    sha256 "e1a87b8e6c46b47195ed6292c884be4cdfbfa88a7a827f8734ab21d632ec78fc"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.57.0/claudebrowser-macos-x64"
    sha256 "1ff3ec558a296f7f58c262deae8b4d68e307187585c112dbbf0ed73c2191fbbc"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
