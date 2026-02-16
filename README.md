# @fleeks-ai/sdk

> TypeScript/JavaScript SDK for the Fleeks AI Development Platform

[![npm version](https://img.shields.io/npm/v/@fleeks-ai/sdk.svg)](https://www.npmjs.com/package/@fleeks-ai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-green.svg)](https://nodejs.org)

## Installation

```bash
npm install @fleeks-ai/sdk
```

## Quick Start

```typescript
import { FleeksClient } from '@fleeks-ai/sdk';

const client = new FleeksClient({ apiKey: 'fleeks_...' });

// Create a workspace
const workspace = await client.workspaces.create({
  projectId: 'my-project',
  template: 'python',
});

// Create and run a file
await workspace.files.create('hello.py', 'print("Hello from Fleeks!")');
const result = await workspace.terminal.execute('python hello.py');
console.log(result.stdout); // "Hello from Fleeks!"

// Clean up
await workspace.delete();
await client.close();
```

## Authentication

Get your API key from [fleeks.ai](https://fleeks.ai). Keys must start with `fleeks_` and be at least 32 characters.

```typescript
// Option 1: Pass directly
const client = new FleeksClient({ apiKey: 'fleeks_...' });

// Option 2: Environment variable
// Set FLEEKS_API_KEY=fleeks_... in your environment
const client = new FleeksClient();
```

## Core Concepts

### Workspaces

Workspaces are cloud development environments. Each workspace has a container with a full Linux environment.

```typescript
// Create
const workspace = await client.workspaces.create({
  projectId: 'my-project',
  template: 'python', // python, node, go, rust, java, default
});

// List
const workspaces = await client.workspaces.list();

// Get
const ws = await client.workspaces.get('my-project');

// Health check
const health = await ws.getHealth();

// Delete
await ws.delete();
```

### Files

```typescript
// Create a file
await workspace.files.create('src/main.py', 'print("hello")');

// Read a file
const content = await workspace.files.read('src/main.py');

// Update a file
await workspace.files.update('src/main.py', 'print("updated")');

// List directory
const listing = await workspace.files.list('src', { recursive: true });

// Create directory
await workspace.files.mkdir('src/utils', { parents: true });

// Upload a file
await workspace.files.upload('data.csv', myBlob);

// Delete a file
await workspace.files.delete('old-file.py');
```

### Terminal

```typescript
// Execute a command (blocking)
const result = await workspace.terminal.execute('python main.py');
console.log(result.stdout, result.stderr, result.exitCode);

// Run in background
const job = await workspace.terminal.startBackgroundJob('npm start');

// Wait for completion
const completed = await workspace.terminal.waitForJob(job.jobId, {
  pollInterval: 1000,
  timeout: 60_000,
});

// Get output
const output = await workspace.terminal.getJobOutput(job.jobId, 100);

// List jobs
const jobs = await workspace.terminal.listJobs();

// Stop a job
await workspace.terminal.stopJob(job.jobId);
```

### Containers

```typescript
// Get info
const info = await workspace.containers.getInfo();

// Get resource stats
const stats = await workspace.containers.getStats();
console.log(`CPU: ${stats.cpuPercent}%, Memory: ${stats.memoryMb}MB`);

// Execute command directly
const result = await workspace.containers.exec('ls -la /workspace');

// List processes
const processes = await workspace.containers.getProcesses();

// Restart
await workspace.containers.restart();
```

### Lifecycle Management

```typescript
import { LifecyclePresets, IdleAction } from '@fleeks-ai/sdk';

// Send heartbeat
await workspace.containers.heartbeat();

// Extend timeout
await workspace.containers.extendTimeout(30); // +30 minutes

// Apply a preset
await workspace.containers.configureLifecycle(LifecyclePresets.development());

// Hibernate and wake
await workspace.containers.hibernate();
await workspace.containers.wake();

// Keep-alive (requires PRO+ tier)
await workspace.containers.setKeepAlive(true);
```

### Agents

```typescript
import { AgentType } from '@fleeks-ai/sdk';

// Execute an agent task
const execution = await workspace.agents.execute({
  task: 'Write unit tests for main.py',
  agentType: AgentType.CODE,
  maxIterations: 10,
  autoApprove: false,
});

// Check status
const status = await workspace.agents.getStatus(execution.agentId);
console.log(`Progress: ${status.progress}%`);

// Get output
const output = await workspace.agents.getOutput(execution.agentId);
console.log('Files modified:', output.filesModified);

// Handoff with context
await workspace.agents.handoff({
  task: 'Continue fixing the bug',
  localContext: { error: 'TypeError at line 42' },
});

// Stop an agent
await workspace.agents.stop(execution.agentId);
```

### Embeds

```typescript
import { EmbedTemplate, EmbedTheme, EmbedLayoutPreset } from '@fleeks-ai/sdk';

// Create with convenience factory
const embed = await client.embeds.createReact('My Demo', {
  'App.jsx': 'export default () => <h1>Hello!</h1>',
}, {
  theme: EmbedTheme.GITHUB_DARK,
  layoutPreset: EmbedLayoutPreset.SIDE_BY_SIDE,
});

// Get embed URL and HTML
console.log(embed.embedUrl);    // https://embed.fleeks.ai/{id}
console.log(embed.iframeHtml);  // <iframe src="..." ...></iframe>

// Update
await embed.update({ theme: EmbedTheme.DRACULA });
await embed.updateFile('App.jsx', 'export default () => <h1>Updated!</h1>');

// Lifecycle
await embed.pause();
await embed.resume();
await embed.archive();

// Duplicate
const copy = await embed.duplicate('My Demo Copy');

// Analytics
const analytics = await embed.getAnalytics('7d');

// Sessions
const sessions = await embed.getSessions();
await embed.terminateAllSessions();
```

### Streaming (Real-time Events)

```typescript
// Watch file changes
for await (const event of client.streaming.watchFiles('my-project')) {
  console.log(`${event.eventType}: ${event.path}`);
}

// Stream agent progress
for await (const event of client.streaming.streamAgent('agent-123')) {
  console.log(`${event.progress}% - ${event.currentStep}`);
}

// Stream terminal output
for await (const event of client.streaming.streamTerminal('my-project', 'session-1')) {
  process.stdout.write(event.output);
}
```

## Error Handling

All errors extend `FleeksError`:

```typescript
import {
  FleeksError,
  FleeksAPIError,
  FleeksAuthenticationError,
  FleeksRateLimitError,
  FleeksResourceNotFoundError,
} from '@fleeks-ai/sdk';

try {
  await client.workspaces.get('nonexistent');
} catch (error) {
  if (error instanceof FleeksResourceNotFoundError) {
    console.log('Workspace not found');
  } else if (error instanceof FleeksRateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof FleeksAuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof FleeksError) {
    console.log('Fleeks SDK error:', error.message);
  }
}
```

## Configuration

```typescript
const client = new FleeksClient({
  apiKey: 'fleeks_...',
  config: {
    baseUrl: 'https://api.fleeks.ai',  // API base URL
    timeout: 30_000,                     // Request timeout (ms)
    maxRetries: 3,                       // Retry attempts
    autoReconnect: true,                 // Socket.IO auto-reconnect
    reconnectAttempts: 5,                // Max reconnect attempts
    reconnectDelay: 1_000,               // Delay between reconnects (ms)
  },
});
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for TypeScript users)

## License

MIT
