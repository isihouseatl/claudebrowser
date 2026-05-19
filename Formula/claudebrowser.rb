# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.84.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.84.0/claudebrowser-macos-arm64"
    sha256 "cffd7e6facf3d4165da2eb415730667da45241862e9029196d025740521dc61a"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.84.0/claudebrowser-macos-x64"
    sha256 "421c844f7cc06fcd53c04635ca48ea1de40ff35bc8ee36b46d7257de55f595c9"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
