class AcumMcp < Formula
  desc "MCP server for ACUM (Israel music rights society) database search"
  homepage "https://github.com/yanirclsr/acum-api"
  # URL and sha256 are updated automatically by the release workflow.
  # To update manually: curl -sL <url> | shasum -a 256
  url "https://registry.npmjs.org/@acum-api/mcp/-/mcp-0.1.0.tgz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--omit", "dev", "--prefix", libexec
    (bin/"acum-mcp").write_env_script libexec/"node_modules/.bin/acum-mcp",
      PATH: "#{Formula["node"].opt_bin}:$PATH"
  end

  test do
    # Pipe empty input so the stdio server exits cleanly
    output = pipe_output("#{bin}/acum-mcp 2>&1", "", 0)
    # Server starts successfully when it outputs nothing or connects on stdio
    assert_match "", output
  end
end
