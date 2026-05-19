# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.44.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.44.0/claudebrowser-macos-arm64"
    sha256 "180126ca63a623705cc454cfc7a65ea12cff2fff522faba6614ae7a203792da0"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.44.0/claudebrowser-macos-x64"
    sha256 "c2b4f6fde575ab1c27ef0cd6c344004decb62e394975a1f560a0c88c41f0a48f"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
