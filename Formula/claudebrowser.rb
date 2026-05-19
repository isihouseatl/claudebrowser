# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.50.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.50.0/claudebrowser-macos-arm64"
    sha256 "78d665b11311c164c2e82786fa093a15f3790b93eae6fa7f072c6773bce8518a"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.50.0/claudebrowser-macos-x64"
    sha256 "e4318fa0e6136598f477e968062a441bd200a8305af3843bab959af6f4afaa24"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
