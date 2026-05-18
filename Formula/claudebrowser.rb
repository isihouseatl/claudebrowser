# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.19.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.19.0/claudebrowser-macos-arm64"
    sha256 "59b6c58789268116b48d9a48f100208e55251f0e8cc0489ed4b2b5685c4d6adf"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.19.0/claudebrowser-macos-x64"
    sha256 "214154f9e5aa80450ed9a4d15912c2adb6d9f94f993fcd5da184a28f4b63a8bd"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
