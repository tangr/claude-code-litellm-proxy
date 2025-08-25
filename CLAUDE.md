# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

此项目使用 Docker 和 Docker Compose 进行所有开发、启动和生产工作流程：

- `docker-compose up` - 启动开发环境
- `docker-compose up --build` - 重新构建并启动开发环境
- `docker-compose up -d` - 在后台启动
- `docker-compose down` - 停止所有服务
- `docker-compose logs` - 查看所有服务的日志

项目已配置完整的 Docker 开发和生产环境。

## 项目介绍

这个项目的主要功能是将 claude code 请求转发到 litellm，作为 proxy。

## 架构

这是一个使用 TypeScript 和 React 19 的 Create React App 项目。代码库遵循标准的 CRA 结构：

- `src/` - 主应用程序源代码
- `src/App.tsx` - 主应用程序组件
- `src/index.tsx` - 使用 React 19 root API 的应用程序入口点
- `public/` - 静态资源和 HTML 模板

项目使用：

- 启用严格模式的 TypeScript
- 带有 JSX 转换的 React 19
- Create React App 的内置 ESLint 配置
- Jest 和 React Testing Library 进行测试
- 代码注释使用英文

## Docker 配置

项目已完整配置 Docker 开发和生产环境：

- `Dockerfile` - 多阶段构建，支持开发和生产环境
- `docker-compose.yml` - 生产环境配置，包含健康检查
- `docker-compose.override.yml` - 开发环境配置，支持热重载和文件监听
- `.dockerignore` - 排除构建上下文中不必要的文件

开发环境会自动使用 override 配置启用热重载和文件监听功能。
