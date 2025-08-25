# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This project uses Docker and Docker Compose for all development, startup and production workflows:

- `docker-compose up` - Start development environment
- `docker-compose up --build` - Rebuild and start development environment  
- `docker-compose up -d` - Start in background
- `docker-compose down` - Stop all services
- `docker-compose logs` - View logs from all services

Note: Docker configuration files (Dockerfile, docker-compose.yml) need to be created for this React TypeScript project.

## Architecture

This is a Create React App project using TypeScript and React 19. The codebase follows standard CRA structure:

- `src/` - Main application source code
- `src/App.tsx` - Main application component  
- `src/index.tsx` - Application entry point with React 19 root API
- `public/` - Static assets and HTML template

The project uses:
- TypeScript with strict mode enabled
- React 19 with JSX transform
- Create React App's built-in ESLint configuration
- Jest and React Testing Library for testing

## Docker Setup Required

The project currently lacks Docker configuration. Required files:
- `Dockerfile` - For building the React application
- `docker-compose.yml` - For orchestrating development and production environments
- `.dockerignore` - To exclude unnecessary files from Docker context