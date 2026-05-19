# Formula/claudebrowser.rb
class Claudebrowser < Formula
  desc "Claude Code browser automation via Chrome CDP"
  homepage "https://github.com/isihouseatl/claudebrowser"
  version "1.74.0"
  license "MIT"

  on_arm do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.74.0/claudebrowser-macos-arm64"
    sha256 "b5071eda457704f33b524299f08f93721e88f4eb7f0621880aa3840711ea1005"
  end

  on_intel do
    url "https://github.com/isihouseatl/claudebrowser/releases/download/v1.74.0/claudebrowser-macos-x64"
    sha256 "082ab87cf6aa1e5cc4a4df83eebec37378ec17ef0dbba3b4fc9654938875ff4b"
  end

  def install
    arch = Hardware::CPU.arm? ? "arm64" : "x64"
    bin.install "claudebrowser-macos-#{arch}" => "claudebrowser"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/claudebrowser --version")
  end
end
