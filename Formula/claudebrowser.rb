# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.11.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.11.0/claudebrowser-macos-arm64"
    sha256 "9f504af00c79867ceba58a5da126b246580f369baad76ec51179f9a23cec40f3"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.11.0/claudebrowser-macos-x64"
    sha256 "4ed9d57219b605c58a4ae60324319227b7acbf05d6ed05657a0437002beefbf3"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
