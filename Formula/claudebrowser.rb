# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.31.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.31.0/claudebrowser-macos-arm64"
    sha256 "4f18321e0d8532751cae3acd1cea95f50b20a483f3c2e7063d7dbbf998770fc1"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.31.0/claudebrowser-macos-x64"
    sha256 "b1a36fc96d1f72ee99b0c04f526793dad8a45a16cddf646dfb3a5bea4ed1abb5"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
