# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.16.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.16.0/claudebrowser-macos-arm64"
    sha256 "52c290d131a3a16352218e8e6cf5d9a05bdadef431491a366edbc760a3dd7445"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.16.0/claudebrowser-macos-x64"
    sha256 "0c468ecea820f2b0c126ef0aa6cb2a3debfd9099b0895b815087b1c2b5720ac0"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
