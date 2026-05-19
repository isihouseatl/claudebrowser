# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.45.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.45.0/claudebrowser-macos-arm64"
    sha256 "bbc80e980d48d9d27fcbd45ec95ea7fbb7a411d54c0f3347bfc9da231c965bcf"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.45.0/claudebrowser-macos-x64"
    sha256 "91a8bed466a74c5f69fcba6b25e793ed7c17a927805e7108d8cdab079821ac32"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
