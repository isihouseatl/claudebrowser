# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.88.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.88.0/claudebrowser-macos-arm64"
    sha256 "e96b4c78d34a2f5ea081e0568953e01904d8cc392b4b396f0f25f2aa015993ab"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.88.0/claudebrowser-macos-x64"
    sha256 "0ade830e0e0fc8e0f30b670dc99152aab25c7c7159c11737022b0867fc9e6479"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
