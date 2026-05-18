# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.27.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.27.0/claudebrowser-macos-arm64"
    sha256 "14b25449775a7147cd421bf9f3f345666c4f972f37c234c8a1163e38cd89701c"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.27.0/claudebrowser-macos-x64"
    sha256 "79ead90584e74db81dde0fe22b467fa0ab671a192b140acba744c2d943af5037"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
