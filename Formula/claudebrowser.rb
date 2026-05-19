# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.33.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.33.0/claudebrowser-macos-arm64"
    sha256 "632211970b1bf20228e8c8237db63a5f99e90b772b23d6689b4209911ef20156"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.33.0/claudebrowser-macos-x64"
    sha256 "0e6f1ed9852cd52bd6f22d28417c585163fb21309a2c6fe2c8e8a3a78ee040d8"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
