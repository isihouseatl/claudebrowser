# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.68.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.68.0/claudebrowser-macos-arm64"
    sha256 "75e66656a90275424ffcd92e3509ff945fc63861e5eb17303080943a039b40d2"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.68.0/claudebrowser-macos-x64"
    sha256 "aa85a351008450dcfef1f3a4d63ad2ac1aec0ed1673e6b197d1a15da81096cd9"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
