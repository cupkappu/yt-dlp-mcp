# 字幕功能使用指南

## 功能概述

yt-dlp MCP Server 现在支持完整的字幕下载功能，包括：

1. **列出可用字幕** - 查看视频所有可用的字幕语言
2. **下载字幕内容** - 下载字幕并将内容返回给模型进行分析

## 功能特点

- ✅ 支持手动制作的字幕
- ✅ 支持自动生成的字幕（AI生成）
- ✅ 支持多语言字幕下载
- ✅ 支持多种字幕格式（SRT, VTT, TTML等）
- ✅ 字幕内容直接返回给模型，无需保存到磁盘
- ✅ 自动清理临时文件

## 使用示例

### 1. 列出可用字幕

首先，你可以查看视频有哪些可用的字幕：

```javascript
{
  "name": "list_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

**输出示例：**
```
[info] Available subtitles for dQw4w9WgXcQ:
Language       Name                                                                          Formats
en             English                                                                       vtt, srt, ttml, srv3, srv2, srv1, json3

[info] Available automatic captions for dQw4w9WgXcQ:
Language       Name                                                                          Formats
en             English                                                                       vtt, srt, ttml, srv3, srv2, srv1, json3
ja             Japanese                                                                      vtt, srt, ttml, srv3, srv2, srv1, json3
zh-Hans        Chinese (Simplified)                                                          vtt, srt, ttml, srv3, srv2, srv1, json3
```

### 2. 下载单个语言的字幕

下载英文字幕：

```javascript
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "languages": "en",
    "auto_generated": true,
    "format": "srt"
  }
}
```

**输出示例：**
```
Successfully downloaded 1 subtitle file(s):

=== Rick Astley - Never Gonna Give You Up.en.srt ===
1
00:00:01,360 --> 00:00:03,040
[♪♪♪]

2
00:00:18,640 --> 00:00:21,880
♪ We're no strangers to love ♪

3
00:00:22,640 --> 00:00:26,960
♪ You know the rules
and so do I ♪

... (完整字幕内容)
```

### 3. 下载多语言字幕

同时下载英文、中文和日文字幕：

```javascript
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "languages": "en,zh-Hans,ja",
    "auto_generated": true,
    "format": "srt"
  }
}
```

这将返回所有指定语言的字幕内容。

### 4. 下载所有可用字幕

```javascript
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "languages": "all",
    "auto_generated": true,
    "format": "srt"
  }
}
```

### 5. 使用不同的字幕格式

支持的字幕格式包括：
- `srt` - SubRip格式（最常用）
- `vtt` - WebVTT格式
- `ttml` - Timed Text Markup Language

```javascript
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "languages": "en",
    "auto_generated": true,
    "format": "vtt"  // 使用VTT格式
  }
}
```

## 参数说明

### download_subtitles 参数详解

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `url` | string | ✅ | - | 视频URL |
| `languages` | string | ❌ | "en" | 语言代码，逗号分隔（如 "en,zh,ja"）或 "all" |
| `auto_generated` | boolean | ❌ | true | 是否下载自动生成的字幕（如果手动字幕不可用） |
| `format` | string | ❌ | "srt" | 字幕格式（srt, vtt, ttml等） |

## 实际应用场景

### 场景1：视频内容分析

AI模型可以读取字幕内容，分析视频主题、关键信息等：

```javascript
// 1. 下载字幕
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "languages": "en"
  }
}

// 2. AI分析字幕内容
// 模型可以：
// - 总结视频内容
// - 提取关键信息
// - 翻译字幕
// - 生成视频摘要
```

### 场景2：多语言字幕对比

下载多个语言的字幕进行对比翻译质量：

```javascript
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "languages": "en,zh-Hans,ja,es",
    "auto_generated": true
  }
}
```

### 场景3：字幕内容搜索

下载字幕后，AI可以在字幕中搜索特定内容：

```javascript
// 1. 下载字幕
{
  "name": "download_subtitles",
  "arguments": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "languages": "en"
  }
}

// 2. 搜索特定关键词
// 模型可以找到关键词出现的时间点
```

## 技术实现细节

1. **临时文件管理**：字幕下载到临时目录，读取后自动清理
2. **错误处理**：如果字幕不可用，会返回友好的错误信息
3. **多语言支持**：使用yt-dlp的语言代码系统
4. **格式转换**：yt-dlp自动处理字幕格式转换

## 常见问题

### Q: 如何知道视频有哪些语言的字幕？
A: 先使用 `list_subtitles` 工具查看所有可用字幕。

### Q: 自动生成的字幕准确吗？
A: YouTube的自动字幕使用AI生成，准确度一般在80-95%之间，取决于视频音质和语言。

### Q: 可以下载私有视频的字幕吗？
A: 如果你有访问权限（如通过cookies），可以配置yt-dlp使用认证信息。

### Q: 字幕文件保存在哪里？
A: 字幕内容直接返回给模型，不会永久保存。临时文件会自动清理。

### Q: 支持哪些视频平台？
A: 所有yt-dlp支持的平台都可以下载字幕，包括YouTube, Bilibili, Vimeo等。

## 语言代码参考

常用语言代码：
- `en` - 英语
- `zh-Hans` - 简体中文
- `zh-Hant` - 繁体中文
- `ja` - 日语
- `ko` - 韩语
- `es` - 西班牙语
- `fr` - 法语
- `de` - 德语
- `ru` - 俄语
- `ar` - 阿拉伯语
- `pt` - 葡萄牙语
- `it` - 意大利语

使用 `list_subtitles` 可以查看视频特定的可用语言代码。

## 性能优化建议

1. **按需下载**：只下载需要的语言，避免使用 "all"
2. **选择合适的格式**：SRT格式最小，VTT格式包含更多样式信息
3. **批量处理**：如果需要处理多个视频，建议逐个调用而不是并发

## 更新日志

- **2025-11-05**: 添加字幕下载功能
  - 新增 `list_subtitles` 工具
  - 新增 `download_subtitles` 工具
  - 支持多语言和多格式
  - 自动临时文件清理
