# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.46.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.46.0/claudebrowser-macos-arm64"
    sha256 "92359c76c9b3fe2d032f41adcaa9e204379764a00ce9fdd4f8c5cf1c1b065f17"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.46.0/claudebrowser-macos-x64"
    sha256 "f0baf7fe198279eaecd38615142d2f23eca1589e94ba1724a78424751cb1215f"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
