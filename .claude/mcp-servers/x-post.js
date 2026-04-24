#!/usr/bin/env node
/**
 * X (Twitter) Post MCP Server
 * Provides tweet posting capability for article promotion
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { TwitterApi } = require('twitter-api-v2');

class XPostServer {
  constructor() {
    this.server = new Server(
      {
        name: 'x-post-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Twitter client
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      console.error('X API credentials not found in environment variables');
      this.client = null;
    } else {
      this.client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });
    }

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'post_tweet',
          description: 'X (Twitter) にツイートを投稿する。記事公開の告知などに使用。',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'ツイート本文（280文字以内）',
              },
            },
            required: ['text'],
          },
        },
        {
          name: 'post_article_tweets',
          description: '複数のノウハウ記事を告知するツイートをまとめて投稿する。各ツイート間に3秒の間隔を空ける。',
          inputSchema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                description: '記事情報の配列',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '記事タイトル' },
                    url: { type: 'string', description: '記事URL' },
                    category: { type: 'string', description: 'カテゴリ名' },
                    excerpt: { type: 'string', description: '概要（任意）' },
                  },
                  required: ['title', 'url'],
                },
              },
            },
            required: ['articles'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.client) {
        return {
          content: [{ type: 'text', text: 'エラー: X API認証情報が設定されていません。.envにX_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRETを設定してください。' }],
        };
      }

      try {
        switch (name) {
          case 'post_tweet':
            return await this.postTweet(args.text);
          case 'post_article_tweets':
            return await this.postArticleTweets(args.articles);
          default:
            return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `エラー: ${error.message}` }],
        };
      }
    });
  }

  async postTweet(text) {
    if (text.length > 280) {
      return {
        content: [{ type: 'text', text: `エラー: ツイートが280文字を超えています（${text.length}文字）` }],
      };
    }

    const result = await this.client.v2.tweet(text);
    const tweetId = result.data.id;
    const tweetUrl = `https://x.com/i/web/status/${tweetId}`;

    return {
      content: [{ type: 'text', text: `投稿完了\nID: ${tweetId}\nURL: ${tweetUrl}` }],
    };
  }

  async postArticleTweets(articles) {
    const results = [];

    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      const categoryTag = a.category ? `【${a.category}】` : '';
      const text = `📝 新着記事を公開しました！\n\n${categoryTag}${a.title}\n\n${a.url}\n\n#転職 #転職活動 #転職ノウハウ`;

      if (text.length > 280) {
        results.push({ title: a.title, status: 'SKIP', reason: `280文字超過（${text.length}文字）` });
        continue;
      }

      try {
        const result = await this.client.v2.tweet(text);
        const tweetId = result.data.id;
        results.push({
          title: a.title,
          status: 'OK',
          tweetUrl: `https://x.com/i/web/status/${tweetId}`,
        });
      } catch (error) {
        results.push({ title: a.title, status: 'FAIL', reason: error.message });
      }

      // 3秒待機（レートリミット対策）
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const summary = results.map(r =>
      r.status === 'OK'
        ? `✅ ${r.title}\n   ${r.tweetUrl}`
        : `❌ ${r.title}: ${r.reason}`
    ).join('\n');

    return {
      content: [{ type: 'text', text: `X投稿結果:\n${summary}` }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new XPostServer();
server.run().catch(console.error);
