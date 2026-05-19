# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.63.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.63.0/claudebrowser-macos-arm64"
    sha256 "a864cebd624ddf222bb49c0e19964b006ed336e4461b9078183b3794923efc6a"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.63.0/claudebrowser-macos-x64"
    sha256 "1b4eb6ddf0e2b1a29edcebcf0532840dc9fcdd73be416bf3a81044bb26b65bb3"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
