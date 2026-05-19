# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.65.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.65.0/claudebrowser-macos-arm64"
    sha256 "05ba68da647f05abc7dda21550d6d54a3cdab5e89f7e4a462762b7a86ae5dd59"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.65.0/claudebrowser-macos-x64"
    sha256 "2069b07cb450150a50d630f527bfbca05d8e17105d1f1080b700f376b4e29e2e"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
