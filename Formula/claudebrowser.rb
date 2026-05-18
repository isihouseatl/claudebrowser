# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.4.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.4.0/claudebrowser-macos-arm64"
    sha256 "3f37681ee6678a586391590372ef0a27687925ebfc08e19ddb905f70438904f3"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.4.0/claudebrowser-macos-x64"
    sha256 "36416ba8cc75d84c7f1271e37c0ea77a48311b90895387093672a8ce8adacdb9"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
