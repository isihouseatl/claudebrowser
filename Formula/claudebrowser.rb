# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.61.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.61.0/claudebrowser-macos-arm64"
    sha256 "9550435231ea3eec6a10eff66a62b99a5cfb1a4a87d04ed900eec4f9858ee353"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.61.0/claudebrowser-macos-x64"
    sha256 "12438065ff95bb9aeb4f63747fbf305bacc0004d6142c7d515fab5887d2ecee8"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
