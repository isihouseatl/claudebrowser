# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.53.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.53.0/claudebrowser-macos-arm64"
    sha256 "73a748c9164161350112a01b8161c9bc7d4241476d359e9f6e605f7a91ff56c6"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.53.0/claudebrowser-macos-x64"
    sha256 "24a790e4a7e6ccec09ccad1534cd553a68236837edb93eb79f30318d07ec830f"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
