# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/YOUR_GITHUB/claudebrowser"
  version "1.0.0"
  license "MIT"

  on_arm do
    url "https://github.com/YOUR_GITHUB/claudebrowser/releases/download/v1.0.0/claudebrowser-macos-arm64"
    sha256 "d18d3fd9ac8e016d7753a80cbceb9f4ea0d47ca0c99998d2074cd93b48fd7035"
  end

  on_intel do
    url "https://github.com/YOUR_GITHUB/claudebrowser/releases/download/v1.0.0/claudebrowser-macos-x64"
    sha256 "f70291efa8bcafbd06a8880d8ddd49f8f75c6d44d31bbcdd0bc13c9a5ab375a5"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
