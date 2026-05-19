# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.86.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.86.0/claudebrowser-macos-arm64"
    sha256 "0d7310b184a5044e4f960816b5d41a7ecdf87c6f34b4d47d9697463994875813"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.86.0/claudebrowser-macos-x64"
    sha256 "13798aad10ba03a43f9e86060862d973092437c5b41ae816f7ad8d1b93f85838"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
