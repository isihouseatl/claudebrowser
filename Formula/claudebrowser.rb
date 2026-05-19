# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.42.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.42.0/claudebrowser-macos-arm64"
    sha256 "019daf5b83ad5ca66e3939b5ea86c0955e392950b7e743d9398dcb37417b883d"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.42.0/claudebrowser-macos-x64"
    sha256 "3c1febbdf2174a08f20b87ca40f0663ebc2897432e365a1d5c7e0c6c0690e698"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
