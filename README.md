# EzLink Subscription Manager

一个基于 Cloudflare Workers 的订阅管理服务，支持多订阅源合并和链式代理配置。

## 功能特点

- 安全的登录验证系统
- 可视化的配置管理界面
- 支持多个订阅地址合并
- 支持配置链式代理
- 基于 Cloudflare Workers 的全球部署
- 快速响应的 API 服务

## 部署指南

### 前置要求

- [Node.js](https://nodejs.org/) (推荐 v16 或更高版本)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare 账号

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/Axaxin/ezlinkapi.git
   cd ezlinkapi
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置 Cloudflare：
   - 在 Cloudflare 控制台创建一个新的 KV 命名空间
   - 复制 KV 命名空间的 ID
   - 编辑 `wrangler.toml`，替换以下内容：
     ```toml
     [vars]
     ADMIN_PASSWORD = "your-password-here"  # 设置你的管理密码

     [[ kv_namespaces ]]
     binding = "CONFIG_STORE"
     id = "your-kv-namespace-id"  # 替换为你的 KV 命名空间 ID
     ```

4. 部署到 Cloudflare Workers：
   ```bash
   npm run deploy
   ```

## 使用说明

### 管理界面

1. 访问你的 Workers 域名
2. 使用配置的管理密码登录
3. 在管理界面可以：
   - 创建新的配置
   - 编辑现有配置
   - 删除配置
   - 查看配置列表

### 配置项说明

- **配置名称**：唯一标识符，不允许包含标点符号和空格
- **后端地址**：处理订阅的后端服务器地址
- **订阅地址**：每行一个订阅地址，支持多个地址
- **链式代理tag**：可选，用于配置链式代理

### API 使用

访问订阅链接：
```
https://your-worker.workers.dev/sub/配置名
```

## 开发

本地开发：
```bash
npm run dev
```

## 许可证

[MIT License](LICENSE)