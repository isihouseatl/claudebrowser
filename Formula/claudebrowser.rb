# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.6.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.6.0/claudebrowser-macos-arm64"
    sha256 "926a33f145d431986e2c92b3db134b1ce1f114f6f77fc7210f32f29c81ac4008"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.6.0/claudebrowser-macos-x64"
    sha256 "4ea5708f8e5e23dd86d0ed87f9a93cd084f4795ce3526f71d4a22aa07c6f1385"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
