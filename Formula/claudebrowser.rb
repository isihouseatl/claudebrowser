# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.81.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.81.0/claudebrowser-macos-arm64"
    sha256 "02113e831e222bb83421cf06fcda38b284641a2a367f7da6097d3ef2e0da348d"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.81.0/claudebrowser-macos-x64"
    sha256 "242249ae4d58490d1ee66fa484f49422af9e87a1ef50a78e5c99f04f5c0648a7"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
