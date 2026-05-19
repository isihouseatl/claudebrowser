# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.41.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.41.0/claudebrowser-macos-arm64"
    sha256 "c8bc4e867d6291ecdb9a7ae344d179c1c90066f995458d3ad160735352cf1ac2"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.41.0/claudebrowser-macos-x64"
    sha256 "5d7148bdf57ba2099dc40a87c6c2ecd002cd5951fc79b186fbd7be6698142a44"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-\#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("\#{bin}/claudebrowser --version")
  end
end
