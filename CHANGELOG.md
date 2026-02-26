# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-02-27

### Changed

- **AgentManager.stop()**: Changed from `DELETE agents/{id}` to `POST agents/{id}/stop`; now returns `StopAgentResponse` with `agentId`, `status`, `message`, and optional `handoffId`
- **AgentManager.execute()**: Now forwards the `skills` option to the API when provided

### Added

- **StopAgentResponse**: New type for the stop-agent response payload
- **HandoffAgentOptions.skills**: Optional `skills` string array for agent handoff and execution
- **AgentHandoff.workspaceUrl**: Optional workspace URL returned from handoff
- **AgentHandoff.containerId**: Optional container ID returned from handoff
- **AgentHandoff.detectedTypes**: Optional detected file/project types array
- **AgentHandoff.activeSkills**: Optional active skills array

## [0.4.0] - 2026-02-22

### Added

- **DeployManager**: Full deployment lifecycle management — create, status, logs, stream SSE logs, rollback, list, delete
- **DeployStatusResult**: Smart wrapper with `isRunning`, `isSucceeded`, `isFailed` convenience getters
- **DeploymentStatusEnum**: Enum for deployment states (PENDING, IN_PROGRESS, SUCCEEDED, FAILED, CANCELLED)
- **WorkspaceInfo.dbProjectId**: Expose the database project ID on workspace info

### Changed

- **URL Normalization**: All SDK-constructed URLs now strip trailing slashes for consistency
- **HibernationResponse**: Added `.state` getter for convenient access
- **Rate Limit Errors**: 429 responses now preserve the `detail` message from the API response body

### Fixed

- Internal URL builder no longer produces double slashes on nested paths

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
