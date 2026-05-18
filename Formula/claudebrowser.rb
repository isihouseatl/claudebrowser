# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.13.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.13.0/claudebrowser-macos-arm64"
    sha256 "506228bbcdb17715a6a32971f69d79dd6209e6378dbe5e30c16b37a0af5d732f"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.13.0/claudebrowser-macos-x64"
    sha256 "1868e9f653d2f76396d03a0a0d50d8eb26cd099a3631b6b9fdef9e46a276480a"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
