# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.18.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.18.0/claudebrowser-macos-arm64"
    sha256 "737c501fb72505e7576208367ae5dcf3fa96efbace03fd12b6b91ecf88177cbd"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.18.0/claudebrowser-macos-x64"
    sha256 "b3cf6c4f293fe090c2d330e70b66e1be4ba469ee7a22ee3403a7b8601939aed5"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
