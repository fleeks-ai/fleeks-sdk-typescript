# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-16

### Added

- **Core Client**: `FleeksClient` with lazy-loaded service managers
- **WorkspaceManager**: Full CRUD operations for workspaces
- **Workspace**: Scoped instance with files, terminal, containers, and agents managers
- **FileManager**: Create, read, update, delete, list, mkdir, and upload files
- **TerminalManager**: Execute commands, background jobs, job polling
- **ContainerManager**: Container info, stats, exec, processes, restart
- **Lifecycle**: Heartbeat, extend timeout, keep-alive, hibernate, wake, lifecycle config
- **AgentManager**: Execute agents, handoff, status, output, list, stop
- **EmbedManager**: Full embed CRUD with convenience factories (React, Python, Jupyter, Static)
- **Embed**: Instance with update, sessions, analytics, pause/resume/archive, duplicate
- **StreamingClient**: Socket.IO-based file watching, agent streaming, terminal streaming
- **Error Hierarchy**: 8 error classes matching Python SDK parity
- **HTTP Layer**: Fetch-based with retry logic, timeout, error mapping
- **Case Conversion**: Automatic snake_case ↔ camelCase conversion
- **TypeScript Types**: 20+ interfaces, all enums (29 templates, 6 display modes, etc.)
- **Lifecycle Presets**: quickTest, development, agentTask, alwaysOn
- **Tier Limits**: FREE, BASIC, PRO, ULTIMATE, ENTERPRISE
- **Dual Build**: ESM + CJS output with TypeScript declarations
- **Full Test Suite**: Unit tests for all managers, HTTP layer, errors
- **Examples**: Basic usage, embeds, lifecycle management
- **CI/CD**: GitHub Actions publish workflow
