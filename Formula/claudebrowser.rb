# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.30.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.30.0/claudebrowser-macos-arm64"
    sha256 "4be4bb6f76c6b0dfafcdcd3b9723e063c48f31bb2b0b75cd69d2bcc16482695c"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.30.0/claudebrowser-macos-x64"
    sha256 "75ef1e102b768c34932f49a3add0362e932c9b323a0888e1b3974384a483e546"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
