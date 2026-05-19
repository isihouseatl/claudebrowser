# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.87.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.87.0/claudebrowser-macos-arm64"
    sha256 "07b1f29eb14b66720428613a3e7f9fbc53d8a271e150fb645d4c4d9c824a5ce4"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.87.0/claudebrowser-macos-x64"
    sha256 "8143c88f66e9d4438233837e6e276acaa05c2339cba06aa324fc40b1b288a46e"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
