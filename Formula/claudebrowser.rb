# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.24.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.24.0/claudebrowser-macos-arm64"
    sha256 "17bf6c137122550d47fa7d657be65a0a692d38c3ca6824a62f8202cb33140db4"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.24.0/claudebrowser-macos-x64"
    sha256 "a2145f46b2f4249cf3abb9e36c6e6f2099dd87ffa980a23726fa7e4586cb3c53"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
