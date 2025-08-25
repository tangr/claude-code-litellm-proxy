# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

此项目使用 Docker 和 Docker Compose 进行所有开发、启动和生产工作流程：

- `docker-compose up` - 启动开发环境
- `docker-compose up --build` - 重新构建并启动开发环境
- `docker-compose up -d` - 在后台启动
- `docker-compose down` - 停止所有服务
- `docker-compose logs` - 查看所有服务的日志

注意：需要为此 React TypeScript 项目创建 Docker 配置文件（Dockerfile、docker-compose.yml）。

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

## 需要 Docker 设置

项目目前缺少 Docker 配置。需要的文件：

- `Dockerfile` - 用于构建 React 应用程序
- `docker-compose.yml` - 用于编排开发和生产环境
- `.dockerignore` - 排除 Docker 上下文中不必要的文件
