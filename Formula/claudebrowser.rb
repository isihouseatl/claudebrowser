# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.58.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.58.0/claudebrowser-macos-arm64"
    sha256 "6a48a3ba66eaf602b1c9079106c5cc43c1a19af10506849693f4db8af6530318"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.58.0/claudebrowser-macos-x64"
    sha256 "5b688ede583057f6ddf7ad4af454411be1667abcd70aeb05cc9d49fb6f73b708"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
