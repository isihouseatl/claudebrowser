# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.10.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.10.0/claudebrowser-macos-arm64"
    sha256 "68205ec65c1bae168d1894210eef5cecd078be7b4ef510e5bd1c2edbb79941db"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.10.0/claudebrowser-macos-x64"
    sha256 "fe7c1d9a25974e3a8253612af5525b059056d3ea9d6d8b0512b70aa3b1b08638"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
