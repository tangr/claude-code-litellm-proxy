# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目介绍

这个项目是完整的 **Claude Code 到 LiteLLM 的代理服务器**，实现 OpenAI 兼容的 API 接口，将 Claude Code 客户端的请求转发到 LiteLLM 后端。

## 主要功能

- **API 代理**: 完全兼容 OpenAI Chat Completions API
- **认证转发**: 自动转发 Claude Code 客户端的认证 token
- **配置驱动**: 支持多提供商和模型路由配置
- **错误处理**: 完善的错误处理和响应转换
- **Docker 支持**: 完整的容器化部署方案

## 开发命令

此项目使用 Docker 和 Docker Compose 进行所有开发、启动和生产工作流程：

- `docker-compose up` - 启动开发环境
- `docker-compose up --build` - 重新构建并启动开发环境
- `docker-compose up -d` - 在后台启动
- `docker-compose down` - 停止所有服务
- `docker-compose logs` - 查看所有服务的日志

本地开发命令：
- `npm run dev` - 启动开发服务器（需要 ts-node）
- `npm run build` - 构建 TypeScript 项目
- `npm start` - 启动生产服务器

## 架构

这是一个使用 **Node.js + Express + TypeScript** 的代理服务器项目：

### 目录结构
```
src/
├── types/          # TypeScript 类型定义
│   ├── api.ts      # API 请求/响应类型
│   └── config.ts   # 配置文件类型
├── utils/          # 工具类
│   └── config.ts   # 配置加载器
├── services/       # 业务服务
│   └── litellm.ts  # LiteLLM 转发服务
├── routes/         # API 路由
│   └── chat.ts     # 聊天完成路由
└── server.ts       # 主服务器入口
```

### 核心组件
- **ConfigLoader**: YAML 配置文件加载和管理
- **LiteLLMService**: 负责转发请求到 LiteLLM
- **Chat Router**: 处理 `/v1/chat/completions` 端点
- **Express Server**: 主服务器，监听端口 3000

## API 端点

- `GET /` - 服务信息和端点列表
- `GET /health` - 健康检查
- `GET /v1/models` - 获取可用模型列表
- `POST /v1/chat/completions` - 聊天完成接口（OpenAI 兼容）

## Claude Code 客户端配置

在 Claude Code 客户端中配置：

```json
{
  "ANTHROPIC_BASE_URL": "http://localhost:3000",
  "ANTHROPIC_AUTH_TOKEN": "sk-r50AhsV53Mig1a23kl484A"
}
```

## 配置文件

项目使用 `config/config-dev.yaml` 配置文件：

```yaml
LOG_LEVEL: debug
Providers:
  - name: litellm
    api_base_url: http://host.docker.internal:4000/v1/chat/completions
    models:
      - claude-sonnet-4-20250514
Router:
  default: litellm,claude-sonnet-4-20250514
```

## 工作流程

1. Claude Code 客户端发送请求到 `http://localhost:3000/v1/chat/completions`
2. 代理服务器提取认证 token (`ANTHROPIC_AUTH_TOKEN`)
3. 根据配置将请求转发到 LiteLLM (`http://host.docker.internal:4000`)
4. 转发认证 token 作为 `Authorization: Bearer` 头
5. 将 LiteLLM 响应原样返回给客户端

## Docker 配置

项目已完整配置 Docker 开发和生产环境：

- `Dockerfile` - 多阶段构建，支持开发和生产环境
- `docker-compose.yml` - 生产环境配置，包含健康检查
- `docker-compose.override.yml` - 开发环境配置
- `.dockerignore` - 排除构建上下文中不必要的文件

## 测试验证

启动服务后可以通过以下命令测试：

```bash
# 健康检查
curl http://localhost:3000/health

# 模型列表
curl http://localhost:3000/v1/models

# 聊天测试
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-r50AhsV53Mig1a23kl484A" \
  -d '{"model": "claude-sonnet-4-20250514", "messages": [{"role": "user", "content": "Hello!"}], "max_tokens": 50}'
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
