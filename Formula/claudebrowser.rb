# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.83.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.83.0/claudebrowser-macos-arm64"
    sha256 "a03cc5a1373828babd75ae42ee798556f1c811f0c5624f45d0d12c9fe8bc8d1e"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.83.0/claudebrowser-macos-x64"
    sha256 "8775aea9a754989f9d23955dfb05d18f6b218c756d4a42e607e681a26bd5122f"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
