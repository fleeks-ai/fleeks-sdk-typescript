/**
 * Lifecycle management example for @fleeks-ai/sdk
 *
 * Run: npx ts-node examples/lifecycle.ts
 */
import {
  FleeksClient,
  LifecyclePresets,
  IdleAction,
  TIER_LIMITS,
} from '@fleeks-ai/sdk';

async function main() {
  const client = new FleeksClient();

  try {
    // Create a workspace
    const workspace = await client.workspaces.create({
      projectId: 'lifecycle-demo',
      template: 'python',
    });

    const { containers } = workspace;

    // ── Heartbeat ───────────────────────────────────────────
    const heartbeat = await containers.heartbeat();
    console.log('Heartbeat:', heartbeat.message);
    console.log('Next timeout:', heartbeat.nextTimeoutAt);

    // ── Get lifecycle status ────────────────────────────────
    const status = await containers.getLifecycleStatus();
    console.log('State:', status.state);
    console.log('Idle timeout:', status.idleTimeoutMinutes, 'min');
    console.log('Keep-alive:', status.keepAliveEnabled);
    console.log('Time remaining:', status.timeRemainingSeconds, 's');

    // ── Configure with development preset ───────────────────
    const devConfig = LifecyclePresets.development();
    console.log('\nApplying development preset:');
    console.log('  Idle timeout:', devConfig.idleTimeoutMinutes, 'min');
    console.log('  Idle action:', devConfig.idleAction);
    console.log('  Auto-wake:', devConfig.autoWake);

    const newStatus = await containers.configureLifecycle(devConfig);
    console.log('New state:', newStatus.state);

    // ── Extend timeout ──────────────────────────────────────
    const extension = await containers.extendTimeout(30);
    console.log('Timeout extended by', extension.addedMinutes, 'min');
    console.log('New timeout at:', extension.newTimeoutAt);

    // ── Keep-alive ──────────────────────────────────────────
    try {
      const keepAlive = await containers.setKeepAlive(true);
      console.log('Keep-alive:', keepAlive.keepAliveEnabled);
      console.log('Authorized:', keepAlive.isAuthorized);
    } catch (error) {
      console.log('Keep-alive requires higher tier');
    }

    // ── Hibernate and wake ──────────────────────────────────
    console.log('\nHibernating...');
    const hibernateResult = await containers.hibernate();
    console.log('Status:', hibernateResult.status);

    console.log('Waking up...');
    const wakeResult = await containers.wake();
    console.log('Status:', wakeResult.status);
    if (wakeResult.estimatedResumeSeconds) {
      console.log('Estimated resume time:', wakeResult.estimatedResumeSeconds, 's');
    }

    // ── Show available presets ───────────────────────────────
    console.log('\n── Available Presets ──');
    const presets = {
      quickTest: LifecyclePresets.quickTest(),
      development: LifecyclePresets.development(),
      agentTask: LifecyclePresets.agentTask(),
      alwaysOn: LifecyclePresets.alwaysOn(),
    };

    for (const [name, preset] of Object.entries(presets)) {
      console.log(`${name}: ${preset.idleTimeoutMinutes}min, ${preset.idleAction}`);
    }

    // ── Show tier limits ────────────────────────────────────
    console.log('\n── Tier Limits ──');
    for (const [tier, limits] of Object.entries(TIER_LIMITS)) {
      console.log(`${tier}: max ${limits.maxIdleTimeoutMinutes}min, ` +
        `extensions: ${limits.maxExtensions}, ` +
        `hibernate: ${limits.hibernate}, keep-alive: ${limits.keepAlive}`);
    }

    // Clean up
    await workspace.delete();
  } finally {
    await client.close();
  }
}

main().catch(console.error);
