# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.37.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.37.0/claudebrowser-macos-arm64"
    sha256 "6acee535430f3b476cd0ab95e04c83de02a653b60070e62165306dc3a4f04f09"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.37.0/claudebrowser-macos-x64"
    sha256 "b0f0e7370d5c97c08dc4c72e5752cfdb4ee13fd9bd1590c82960bbbee6d0fbbc"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
