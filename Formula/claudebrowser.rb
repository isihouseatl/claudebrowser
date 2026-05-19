# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.89.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.89.0/claudebrowser-macos-arm64"
    sha256 "008f7b5d39138105333b751b7a2020a5ba90897192f3a48ebcdc72b9f83b8455"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.89.0/claudebrowser-macos-x64"
    sha256 "4e6aa81fe0790a220e56eb17d30aba0d17e10557e69077ac54f4ef247fee60c5"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
