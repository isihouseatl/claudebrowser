# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.91.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.91.0/claudebrowser-macos-arm64"
    sha256 "3bdf1fa9b10322a9154a9f1c2ff0786fb2eed6ec0844147138535548c2e1b0fb"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.91.0/claudebrowser-macos-x64"
    sha256 "d284e7b8940ed85fc40fb5f3c5dfd73ca510353edad528a5c9bd2258b2a7445d"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
