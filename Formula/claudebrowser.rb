# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.56.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.56.0/claudebrowser-macos-arm64"
    sha256 "bf3e096755addd3a4eeb91a1d510a3c8fe442e7524ffec1a48820afcffc5ad0c"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.56.0/claudebrowser-macos-x64"
    sha256 "f06113029db4cb2ebdb7e999385a4db3f499ed07b676bba5d8ddbfa257ec3fe0"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
