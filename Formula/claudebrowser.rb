# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.43.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.43.0/claudebrowser-macos-arm64"
    sha256 "653b090b09d67fde4bc559ab389487f1a13938682d04731106a6e4d9b1bb5ee7"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.43.0/claudebrowser-macos-x64"
    sha256 "50af5bcfac03a9bc62c12b644207436b560396c2dfb97da9a2c92789a0cca315"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
