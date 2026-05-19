# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.36.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.36.0/claudebrowser-macos-arm64"
    sha256 "2b622fa6d99f99a1f421d45bccd863a3a64627bfca018d687bed7b07b4b2c731"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.36.0/claudebrowser-macos-x64"
    sha256 "eb9d288b600252c2bcc0eabb4988ddd63fdd44b94625f6e0c946c5a2736b6b2a"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
