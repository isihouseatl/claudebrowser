# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.72.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.72.0/claudebrowser-macos-arm64"
    sha256 "56579bc8bdcccb7fab07297ccb2568e70497841ea56f6e2581431f4fe6940039"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.72.0/claudebrowser-macos-x64"
    sha256 "2a68f25abc275504478152fcf1ee87957dfa4f8b72ae0e9df70d7e79a7a938e4"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
