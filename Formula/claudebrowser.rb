# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.39.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.39.0/claudebrowser-macos-arm64"
    sha256 "270e8256726ac9b9673f117d960608d6d4bb313ab9103f18233484971ef9994b"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.39.0/claudebrowser-macos-x64"
    sha256 "90166bba43cb5eb3f76d57f3c34df36f2c75ecce8697ba039304ba6b276a11c1"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-\#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("\#{bin}/claudebrowser --version")
  end
end
