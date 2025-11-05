#!/usr/bin/env node

import { Server } from "../node_modules/@modelcontextprotocol/sdk/dist/server/index.js";
import { StdioServerTransport } from "../node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "../node_modules/@modelcontextprotocol/sdk/dist/types.js";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec as execCallback } from "child_process";
import { UploadService, UploadConfig } from "./upload-service.js";
import { resolve } from "path";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const exec = promisify(execCallback);

class YtDlpMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "yt-dlp-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "extract_info",
            description: "Extract video information (title, duration, formats) without downloading",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Video URL to extract information from",
                },
                include_formats: {
                  type: "boolean",
                  description: "Whether to include format information",
                  default: true,
                },
              },
              required: ["url"],
            },
          },
          {
            name: "list_formats",
            description: "List available video formats for a given URL",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Video URL to list formats for",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "download_video",
            description: "Download a video with specified options. Upload to WebDAV or S3 if configured via environment variables.",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Video URL to download",
                },
                format: {
                  type: "string",
                  description: "Format selector (e.g., 'best', 'worst', '22')",
                  default: "best",
                },
                output_path: {
                  type: "string",
                  description: "Output file path (optional, uses yt-dlp default if not specified)",
                },
                extract_audio: {
                  type: "boolean",
                  description: "Extract audio only",
                  default: false,
                },
                audio_format: {
                  type: "string",
                  description: "Audio format when extracting audio (mp3, m4a, etc.)",
                  default: "mp3",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "list_subtitles",
            description: "List all available subtitles (both manual and auto-generated) for a video",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Video URL to list subtitles for",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "download_subtitles",
            description: "Download subtitles and return the content to the model. Supports both manual and auto-generated subtitles.",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Video URL to download subtitles from",
                },
                languages: {
                  type: "string",
                  description: "Comma-separated list of language codes (e.g., 'en,zh,ja') or 'all' for all available languages",
                  default: "en",
                },
                auto_generated: {
                  type: "boolean",
                  description: "Whether to download auto-generated subtitles if manual subtitles are not available",
                  default: true,
                },
                format: {
                  type: "string",
                  description: "Subtitle format (srt, vtt, ttml, etc.)",
                  default: "srt",
                },
              },
              required: ["url"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "extract_info":
            return await this.handleExtractInfo(args);
          case "list_formats":
            return await this.handleListFormats(args);
          case "download_video":
            return await this.handleDownloadVideo(args);
          case "list_subtitles":
            return await this.handleListSubtitles(args);
          case "download_subtitles":
            return await this.handleDownloadSubtitles(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async runYtDlpCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const ytDlpProcess = spawn('yt-dlp', args, {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      ytDlpProcess.stdout?.on("data", (data: any) => {
        stdout += data.toString();
      });

      ytDlpProcess.stderr?.on("data", (data: any) => {
        stderr += data.toString();
      });

      ytDlpProcess.on("close", (code: number | null) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
        }
      });

      ytDlpProcess.on("error", (error: Error) => {
        reject(new Error(`Failed to start yt-dlp: ${error.message}`));
      });
    });
  }

  private async handleExtractInfo(args: any) {
    const { url, include_formats = true } = args;

    if (!url || typeof url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    const commandArgs = [
      "--dump-json",
      "--no-download",
      url
    ];

    // Note: include_formats parameter is kept for API compatibility
    // but yt-dlp --dump-json always includes format information
    // To exclude formats, we would need to parse and filter the JSON

    const { stdout } = await this.runYtDlpCommand(commandArgs);

    try {
      const info = JSON.parse(stdout.trim());
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to parse yt-dlp output: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleListFormats(args: any) {
    const { url } = args;

    if (!url || typeof url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    const commandArgs = [
      "--list-formats",
      "--no-download",
      url
    ];

    const { stdout, stderr } = await this.runYtDlpCommand(commandArgs);

    return {
      content: [
        {
          type: "text",
          text: stdout || stderr,
        },
      ],
    };
  }

  private async handleDownloadVideo(args: any) {
    const { url, format = "best", output_path, extract_audio = false, audio_format = "mp3" } = args;

    if (!url || typeof url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    // Generate a unique output path if not specified
    const outputTemplate = output_path || "%(title)s.%(ext)s";
    
    const commandArgs = [
      "-o", outputTemplate,
      "--print", "after_move:filepath"  // Print the final file path after download
    ];

    if (extract_audio) {
      commandArgs.push("-x", "--audio-format", audio_format);
    } else {
      commandArgs.push("-f", format);
    }

    commandArgs.push(url);

    const { stdout, stderr } = await this.runYtDlpCommand(commandArgs);

    // Extract the downloaded file path from stdout
    const downloadedFilePath = stdout.trim().split('\n').pop()?.trim() || "";
    
    if (!downloadedFilePath) {
      throw new Error("Could not determine downloaded file path");
    }

    // Resolve to absolute path
    const absolutePath = resolve(process.cwd(), downloadedFilePath);

    let response = `Download completed successfully.\nFile saved to: ${absolutePath}`;

    // Check if upload is configured via environment variables
    try {
      const uploadConfig = UploadService.createFromEnvironment();
      if (uploadConfig) {
        try {
          const uploadService = new UploadService(uploadConfig);
          const downloadUrl = await uploadService.uploadFile(absolutePath);
          response += `\n\nFile uploaded successfully!\nDownload URL: ${downloadUrl}`;
        } catch (uploadError) {
          response += `\n\nUpload failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`;
        }
      }
    } catch (configError) {
      response += `\n\nUpload configuration error: ${configError instanceof Error ? configError.message : String(configError)}`;
    }

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  private async handleListSubtitles(args: any) {
    const { url } = args;

    if (!url || typeof url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    const commandArgs = [
      "--list-subs",
      "--no-download",
      url
    ];

    const { stdout, stderr } = await this.runYtDlpCommand(commandArgs);

    return {
      content: [
        {
          type: "text",
          text: stdout || stderr,
        },
      ],
    };
  }

  private async handleDownloadSubtitles(args: any) {
    const { url, languages = "en", auto_generated = true, format = "srt" } = args;

    if (!url || typeof url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    // Create a temporary directory for subtitle downloads
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "yt-dlp-subs-"));
    
    try {
      const commandArgs = [
        "--skip-download",
        "--write-subs",
        "--sub-format", format,
        "--sub-langs", languages,
        "-o", path.join(tempDir, "%(title)s.%(ext)s"),
      ];

      // Add auto-generated subtitles flag if requested
      if (auto_generated) {
        commandArgs.push("--write-auto-subs");
      }

      commandArgs.push(url);

      const { stdout, stderr } = await this.runYtDlpCommand(commandArgs);

      // Read all subtitle files from the temp directory
      const files = await fs.readdir(tempDir);
      const subtitleFiles = files.filter(f => f.endsWith(`.${format}`));

      if (subtitleFiles.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No subtitles found for the specified languages (${languages}).\n\nyt-dlp output:\n${stdout || stderr}`,
            },
          ],
        };
      }

      // Read content of all subtitle files
      const subtitleContents = await Promise.all(
        subtitleFiles.map(async (file) => {
          const filePath = path.join(tempDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          return {
            filename: file,
            content: content,
          };
        })
      );

      // Format the response
      let responseText = `Successfully downloaded ${subtitleFiles.length} subtitle file(s):\n\n`;
      
      for (const sub of subtitleContents) {
        responseText += `=== ${sub.filename} ===\n`;
        responseText += `${sub.content}\n\n`;
      }

      responseText += `\nyt-dlp output:\n${stdout || stderr}`;

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } finally {
      // Clean up temporary directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error("Failed to clean up temp directory:", error);
      }
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("yt-dlp MCP server running on stdio");
  }
}

const server = new YtDlpMcpServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
