# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.26.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.26.0/claudebrowser-macos-arm64"
    sha256 "4d2b6bfe1b11574f13006e4de343f9eb1be774432871468431d6c00220a18dea"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.26.0/claudebrowser-macos-x64"
    sha256 "6250a1381a4326d6db025711c88da28cb978f0d5470a951c583f7839a1b98f3d"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
