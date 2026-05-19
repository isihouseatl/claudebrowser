# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.34.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.34.0/claudebrowser-macos-arm64"
    sha256 "359b069d4e675e2df8505d11447e92e1fddf3443efb14158604fd156a0803bda"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.34.0/claudebrowser-macos-x64"
    sha256 "35acb62c6bf03fc16c280ce9d6aca545e5c09a84315fc74bb4d5101f4e198bd1"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
