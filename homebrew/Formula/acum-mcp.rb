class AcumMcp < Formula
  desc "MCP server for ACUM (Israel music rights society) database search"
  homepage "https://github.com/yanirclsr/acum-api"
  # URL and sha256 are updated automatically by the release workflow.
  # To update manually: curl -sL <url> | shasum -a 256
  url "https://registry.npmjs.org/@acum-api/mcp/-/mcp-0.1.0.tgz"
  sha256 "b504a685089de31785ed1bfc6785df5dfb6d1b7ea8209ca6fc4bd66228849d45"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--omit", "dev"
    libexec.install Dir["*"]
    chmod 0755, libexec/"dist/index.js"
    (bin/"acum-mcp").write <<~SH
      #!/bin/bash
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/dist/index.js" "$@"
    SH
  end

  test do
    assert_predicate bin/"acum-mcp", :executable?
  end
end
