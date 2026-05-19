# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.35.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.35.0/claudebrowser-macos-arm64"
    sha256 "5d5f07e3d936de8c8bf0ec2223495b5791919edcd1053be3a78408fa7b5deb61"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.35.0/claudebrowser-macos-x64"
    sha256 "98a015f4c48e443cbac6f7fbe4881e32d2c14434a5a4ebdfd8e97d47d1b6f89b"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
