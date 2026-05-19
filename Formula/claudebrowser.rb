# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.40.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.40.0/claudebrowser-macos-arm64"
    sha256 "20beddc5cd1001828012e14cc367a2355beee2ec343a02179d2f67e4a93730d2"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.40.0/claudebrowser-macos-x64"
    sha256 "99fd13c36d63b941602f11d657ff8164b95005bc0ab50ec50f26bef13d8c2385"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-\#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("\#{bin}/claudebrowser --version")
  end
end
