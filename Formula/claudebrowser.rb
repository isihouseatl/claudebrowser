# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.2.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.0/claudebrowser-macos-arm64"
    sha256 "42bf54eebd28798a3cc4f28b1d27fb26ef6452dfff96bfd22d05a35e5b61722c"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.0/claudebrowser-macos-x64"
    sha256 "8f6abe0739c0dad65004065e2a7d0e2bb11dfe6ac5c34609806c800cbe36f65c"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
