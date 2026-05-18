# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.21.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.21.0/claudebrowser-macos-arm64"
    sha256 "4327287e5a5233a7a71c1e736e6f98d202ffd88795bb5c999e8c8247e0416c2c"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.21.0/claudebrowser-macos-x64"
    sha256 "58f8211eae68dedb2125e18c1333f3ad93fbc6fa4f1b97a5c12a52baece9a732"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
