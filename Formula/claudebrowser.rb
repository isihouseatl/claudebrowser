# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.12.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.12.0/claudebrowser-macos-arm64"
    sha256 "daa59d3192ff448b05cf288150b55ed34babeb3b9b37aa4dff12a99671bb3000"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.12.0/claudebrowser-macos-x64"
    sha256 "6c13c08f0967d152759df2e7e868f825db38ca4e8014d6b16cb34cdc0f50002a"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
