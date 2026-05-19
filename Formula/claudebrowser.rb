# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.67.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.67.0/claudebrowser-macos-arm64"
    sha256 "31578f923fc9d15e34fe6072979c81d57ea99d436cabdaf21e0e0c42d93111fa"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.67.0/claudebrowser-macos-x64"
    sha256 "d5f0dcb32e3b0a079adb44b74a65d1cf3339506224cdbcb69f4f4645a76d6740"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
