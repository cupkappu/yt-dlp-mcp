# 在 Claude Desktop 中配置 yt-dlp MCP Server

## 配置步骤

### 1. 确保项目已构建

```bash
cd /Users/kifuko/Documents/dev/yt-dlp-mcp
npm install
npm run build
```

### 2. 配置 Claude Desktop

编辑 Claude Desktop 的配置文件：

**macOS 位置:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows 位置:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 3. 添加配置

在配置文件中添加以下内容：

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "node",
      "args": [
        "/Users/kifuko/Documents/dev/yt-dlp-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

**注意**: 请将路径 `/Users/kifuko/Documents/dev/yt-dlp-mcp/dist/index.js` 替换为你的实际项目路径。

### 4. 重启 Claude Desktop

保存配置文件后，完全退出并重新启动 Claude Desktop。

## 验证配置

重启后，你可以通过以下方式验证配置是否成功：

1. 在 Claude Desktop 中，工具列表应该会显示：
   - extract_info
   - list_formats
   - download_video
   - **list_subtitles** (新增)
   - **download_subtitles** (新增)

2. 尝试使用字幕功能：

```
请帮我列出这个视频的可用字幕：
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

或

```
请下载这个视频的英文字幕并分析内容：
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## 使用示例

### 示例 1: 视频内容总结

```
请下载这个教程视频的英文字幕，然后总结主要内容：
https://www.youtube.com/watch?v=VIDEO_ID
```

Claude 将会：
1. 使用 `download_subtitles` 工具下载字幕
2. 阅读字幕内容
3. 生成视频内容总结

### 示例 2: 多语言字幕对比

```
请下载这个视频的英文和中文字幕，对比翻译质量：
https://www.youtube.com/watch?v=VIDEO_ID
```

### 示例 3: 搜索特定内容

```
请下载这个视频的字幕，找出提到 "machine learning" 的所有时间点：
https://www.youtube.com/watch?v=VIDEO_ID
```

### 示例 4: 生成视频笔记

```
请基于这个视频的字幕生成学习笔记：
https://www.youtube.com/watch?v=VIDEO_ID
```

## 完整配置示例

如果你有多个 MCP 服务器，配置文件可能如下：

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "node",
      "args": [
        "/Users/kifuko/Documents/dev/yt-dlp-mcp/dist/index.js"
      ],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/kifuko/Documents"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 故障排除

### 问题 1: Claude Desktop 无法连接到服务器

**解决方案:**
1. 检查路径是否正确
2. 确保 `npm run build` 已成功执行
3. 检查 `dist/index.js` 文件是否存在
4. 查看 Claude Desktop 的日志文件

### 问题 2: yt-dlp 命令未找到

**解决方案:**
```bash
# macOS
brew install yt-dlp

# Linux
pip install yt-dlp

# 或者使用系统包管理器
```

### 问题 3: 字幕下载失败

**可能原因:**
- 视频没有字幕
- 指定的语言不可用
- 网络连接问题

**解决方案:**
1. 先使用 `list_subtitles` 查看可用字幕
2. 确保指定正确的语言代码
3. 检查网络连接

## 高级配置

### 设置代理

如果需要使用代理，可以添加环境变量：

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "node",
      "args": [
        "/Users/kifuko/Documents/dev/yt-dlp-mcp/dist/index.js"
      ],
      "env": {
        "HTTP_PROXY": "http://proxy.example.com:8080",
        "HTTPS_PROXY": "http://proxy.example.com:8080"
      }
    }
  }
}
```

### 自定义工作目录

```json
{
  "mcpServers": {
    "yt-dlp": {
      "command": "node",
      "args": [
        "/Users/kifuko/Documents/dev/yt-dlp-mcp/dist/index.js"
      ],
      "cwd": "/Users/kifuko/Downloads",
      "env": {}
    }
  }
}
```

## 性能优化

1. **首次启动可能较慢**: MCP 服务器需要初始化，首次连接可能需要几秒钟
2. **并发限制**: 避免同时下载多个视频的字幕
3. **缓存**: yt-dlp 会缓存视频信息，重复请求会更快

## 隐私和安全

1. **本地运行**: 所有数据处理都在本地进行
2. **临时文件**: 字幕下载到临时目录，使用后自动清理
3. **无数据收集**: 不会发送任何使用数据到外部服务器

## 更新服务器

当有新功能或修复时：

```bash
cd /Users/kifuko/Documents/dev/yt-dlp-mcp
git pull  # 如果使用 git
npm install  # 更新依赖
npm run build  # 重新构建
```

然后重启 Claude Desktop。

## 获取帮助

- 查看 [README.md](./README.md) 了解基本功能
- 查看 [SUBTITLES_GUIDE.md](./SUBTITLES_GUIDE.md) 了解字幕功能详情
- 查看 yt-dlp 文档: https://github.com/yt-dlp/yt-dlp

## 支持的平台

理论上支持所有 yt-dlp 支持的平台，包括但不限于：

- YouTube
- Bilibili
- Twitter/X
- TikTok
- Vimeo
- Twitch
- 等 1000+ 网站

字幕功能的可用性取决于各平台是否提供字幕。
