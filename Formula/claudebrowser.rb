# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.52.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.52.0/claudebrowser-macos-arm64"
    sha256 "c418a92fdea0c22fb7108d9e6c446feedf989c43ab52a3f4521b203ec809e3aa"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.52.0/claudebrowser-macos-x64"
    sha256 "ac409a528a2afa3c00fae2bc6f6a20058a36b0c554089f3301a3ee56a156b084"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
