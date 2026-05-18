# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.2.1"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.1/claudebrowser-macos-arm64"
    sha256 "2e4af00c8c7476e5a66bdd738783b083041b5a4abdf03bba52a39ab062d19e79"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.2.1/claudebrowser-macos-x64"
    sha256 "fbf994e5e54cf8dcb86622286c4231c94db93b37dc581aab00e95ec9b7cec688"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/claudebrowser --version")
  end
end
