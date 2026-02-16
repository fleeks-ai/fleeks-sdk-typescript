/**
 * Basic usage example for @fleeks/sdk
 *
 * Run: npx ts-node examples/basic-usage.ts
 */
import { FleeksClient } from '@fleeks/sdk';

async function main() {
  // Create a client (reads FLEEKS_API_KEY from env if not passed)
  const client = new FleeksClient({
    apiKey: process.env.FLEEKS_API_KEY,
  });

  try {
    // Check API health
    const health = await client.healthCheck();
    console.log('API Health:', health);

    // Get API key info
    const keyInfo = await client.getApiKeyInfo();
    console.log('API Key Info:', keyInfo);

    // Create a workspace
    const workspace = await client.workspaces.create({
      projectId: 'my-first-project',
      template: 'python',
    });
    console.log(`Workspace created: ${workspace.projectId}`);
    console.log(`Container ID: ${workspace.containerId}`);
    console.log(`Preview URL: ${workspace.previewUrl}`);

    // Create a file
    await workspace.files.create('hello.py', 'print("Hello from Fleeks!")');

    // List files
    const listing = await workspace.files.list();
    console.log(`Files (${listing.totalCount}):`, listing.files.map(f => f.name));

    // Execute a command
    const result = await workspace.terminal.execute('python hello.py');
    console.log('Output:', result.stdout);
    console.log('Exit code:', result.exitCode);

    // Get container stats
    const stats = await workspace.containers.getStats();
    console.log(`CPU: ${stats.cpuPercent}%, Memory: ${stats.memoryMb}MB`);

    // Clean up
    await workspace.delete();
    console.log('Workspace deleted');
  } finally {
    await client.close();
  }
}

main().catch(console.error);
