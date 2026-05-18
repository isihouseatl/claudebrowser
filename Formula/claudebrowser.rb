# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.28.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.28.0/claudebrowser-macos-arm64"
    sha256 "c91403143c16cdc04ea3048e0c016c60eeaf65d47e37dc4df18bd15e90a5c2fc"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.28.0/claudebrowser-macos-x64"
    sha256 "c87ef1d8ca2e2f4963e201053430b18dde4eaf52f876383a23c24db78f430be0"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
