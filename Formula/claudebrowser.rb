# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.76.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.76.0/claudebrowser-macos-arm64"
    sha256 "16d3e66d99de4b8f79d93e5bee1d02fbfaf9ea8f0264420df65541d552f40978"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.76.0/claudebrowser-macos-x64"
    sha256 "492f6c11412b008816e6f3821353e90e09649193536f25da42b0fe6c1177ef05"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
