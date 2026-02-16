/**
 * Embeds example for @fleeks-ai/sdk
 *
 * Run: npx ts-node examples/embeds.ts
 */
import {
  FleeksClient,
  EmbedTemplate,
  DisplayMode,
  EmbedTheme,
  EmbedLayoutPreset,
} from '@fleeks-ai/sdk';

async function main() {
  const client = new FleeksClient();

  try {
    // ── Create a React embed ────────────────────────────────
    const reactEmbed = await client.embeds.createReact(
      'My React Demo',
      {
        'App.jsx': `
          export default function App() {
            return <h1>Hello from Fleeks Embed!</h1>;
          }
        `,
      },
      {
        theme: EmbedTheme.GITHUB_DARK,
        layoutPreset: EmbedLayoutPreset.SIDE_BY_SIDE,
        showTerminal: true,
        showFileTree: true,
      }
    );

    console.log('React embed created:', reactEmbed.id);
    console.log('Embed URL:', reactEmbed.embedUrl);
    console.log('iframe HTML:', reactEmbed.iframeHtml);

    // ── Create a Python embed ───────────────────────────────
    const pythonEmbed = await client.embeds.createPython(
      'Python Calculator',
      {
        'main.py': `
def add(a, b):
    return a + b

if __name__ == '__main__':
    result = add(2, 3)
    print(f"2 + 3 = {result}")
        `,
      }
    );
    console.log('Python embed:', pythonEmbed.embedUrl);

    // ── Create a Jupyter embed ──────────────────────────────
    const jupyterEmbed = await client.embeds.createJupyter('Data Analysis');
    console.log('Jupyter embed:', jupyterEmbed.embedUrl);

    // ── List all embeds ─────────────────────────────────────
    const allEmbeds = await client.embeds.list();
    console.log(`Total embeds: ${allEmbeds.length}`);

    // ── Update an embed ─────────────────────────────────────
    const updated = await reactEmbed.update({
      name: 'My Updated React Demo',
      theme: EmbedTheme.DRACULA,
    });
    console.log('Updated embed name:', updated.info.name);

    // ── Update a single file ────────────────────────────────
    await reactEmbed.updateFile('App.jsx', `
      export default function App() {
        return <h1>Updated content!</h1>;
      }
    `);

    // ── Get analytics ───────────────────────────────────────
    const analytics = await reactEmbed.getAnalytics('7d');
    console.log('Analytics:', analytics);

    // ── Get total analytics ─────────────────────────────────
    const totalAnalytics = await client.embeds.getTotalAnalytics('30d');
    console.log('Total analytics:', totalAnalytics);

    // ── Pause and resume ────────────────────────────────────
    await reactEmbed.pause();
    console.log('Embed paused');

    await reactEmbed.resume();
    console.log('Embed resumed');

    // ── Duplicate ───────────────────────────────────────────
    const duplicated = await reactEmbed.duplicate('React Demo Copy');
    console.log('Duplicated embed:', duplicated.id);

    // ── Session management ──────────────────────────────────
    const sessions = await reactEmbed.getSessions();
    console.log(`Active sessions: ${sessions.length}`);

    // ── Clean up ────────────────────────────────────────────
    await duplicated.delete();
    await reactEmbed.delete();
    await pythonEmbed.delete();
    await jupyterEmbed.delete();
    console.log('All embeds cleaned up');
  } finally {
    await client.close();
  }
}

main().catch(console.error);
