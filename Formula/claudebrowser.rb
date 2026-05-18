# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.23.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.23.0/claudebrowser-macos-arm64"
    sha256 "b7fc81cdd29af7be5665b3a26803681d760e892af28e8f14488bba11c21d1a6c"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.23.0/claudebrowser-macos-x64"
    sha256 "59f6c78f77596a5e8f8ad76449175e9ae77ca4b69d49409c244fd8e2bd09d8d1"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
