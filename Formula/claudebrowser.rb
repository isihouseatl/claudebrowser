# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.9.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.9.0/claudebrowser-macos-arm64"
    sha256 "33450d84fff87f6c7eb7e3c7cc83d9e6cac809d78174730d45803bcaa05306da"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.9.0/claudebrowser-macos-x64"
    sha256 "266aed53eb3ffb694a28807fbded6a2e0cbda93d850639a04c0b9c4aa64cc9dc"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
