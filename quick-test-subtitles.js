#!/usr/bin/env node

/**
 * 快速测试字幕功能的脚本
 * 使用方法：node quick-test-subtitles.js <youtube_url>
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function quickTest() {
  const url = process.argv[2] || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  
  console.log("🚀 启动 yt-dlp MCP 字幕功能测试");
  console.log(`📺 测试视频: ${url}\n`);

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

  try {
    // 测试 1: 列出字幕
    console.log("📋 步骤 1: 列出可用字幕...");
    console.log("─".repeat(60));
    
    const listResult = await client.callTool({
      name: "list_subtitles",
      arguments: { url },
    });
    
    const listOutput = listResult.content[0].text;
    console.log(listOutput);
    console.log("\n");

    // 测试 2: 下载英文字幕
    console.log("📥 步骤 2: 下载英文字幕...");
    console.log("─".repeat(60));
    
    const downloadResult = await client.callTool({
      name: "download_subtitles",
      arguments: {
        url,
        languages: "en",
        auto_generated: true,
        format: "srt",
      },
    });
    
    const downloadOutput = downloadResult.content[0].text;
    
    // 只显示前30行字幕内容
    const lines = downloadOutput.split('\n');
    const preview = lines.slice(0, 50).join('\n');
    
    console.log(preview);
    console.log(`\n... (总共 ${lines.length} 行)`);
    console.log("\n");

    // 统计信息
    console.log("📊 字幕统计信息:");
    console.log("─".repeat(60));
    const subtitleBlocks = downloadOutput.match(/\d+\n\d{2}:/g);
    if (subtitleBlocks) {
      console.log(`✅ 字幕条目数: ${subtitleBlocks.length}`);
    }
    console.log(`✅ 总字符数: ${downloadOutput.length}`);
    console.log(`✅ 总行数: ${lines.length}`);
    
    console.log("\n✨ 测试完成！");

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    if (error.message.includes("HTTP Error 429")) {
      console.log("\n💡 提示: 请求过于频繁，请稍后再试");
    }
  } finally {
    await client.close();
  }
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║        yt-dlp MCP Server - 字幕功能快速测试              ║
╚══════════════════════════════════════════════════════════╝
`);

quickTest().catch(console.error);
