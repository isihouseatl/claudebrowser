# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.7.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.7.0/claudebrowser-macos-arm64"
    sha256 "abcf8910999fedfa82eb8b6ac7424c188766164dd23f2b528c6e76cd609c6b2d"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.7.0/claudebrowser-macos-x64"
    sha256 "cc82ce44211e173a3520b03fdfed6a35d63c45dbae8733ded06a7c161e56eca5"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
