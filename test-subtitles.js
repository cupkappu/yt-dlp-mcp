import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testSubtitles() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  console.log("Connected to yt-dlp MCP server\n");

  try {
    // Test 1: List available tools
    console.log("=== Testing: List Tools ===");
    const tools = await client.listTools();
    console.log("Available tools:", tools.tools.map(t => t.name).join(", "));
    console.log();

    // Test 2: List subtitles for a video
    console.log("=== Testing: List Subtitles ===");
    const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    console.log(`URL: ${testUrl}`);
    
    const listResult = await client.callTool({
      name: "list_subtitles",
      arguments: {
        url: testUrl,
      },
    });
    
    console.log("List Subtitles Result:");
    console.log(listResult.content[0].text.substring(0, 500) + "...");
    console.log();

    // Test 3: Download subtitles
    console.log("=== Testing: Download Subtitles (English only) ===");
    const downloadResult = await client.callTool({
      name: "download_subtitles",
      arguments: {
        url: testUrl,
        languages: "en",
        auto_generated: true,
        format: "srt",
      },
    });
    
    console.log("Download Result Preview (first 1000 characters):");
    console.log(downloadResult.content[0].text.substring(0, 1000) + "...");
    console.log();

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await client.close();
    console.log("\nTests completed!");
  }
}

testSubtitles().catch(console.error);
