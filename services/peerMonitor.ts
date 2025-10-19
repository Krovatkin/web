// OPTION 3: Periodic Health Check for Manual Peers
// This file is currently not in use - it's here for future implementation
//
// To enable:
// 1. Uncomment all code below
// 2. Import in pages/index.vue:
//    import { startPeerMonitoring, stopPeerMonitoring } from "~/services/peerMonitor";
// 3. Add to onMounted(): startPeerMonitoring();
// 4. Add to onUnmounted(): stopPeerMonitoring();

/*
import { store } from "./store";
import { discoverHttpPeer } from "./http";

// Configuration
const HEALTH_CHECK_INTERVAL = 15000;  // Check every 15 seconds
const REMOVAL_GRACE_PERIOD = 3;       // Remove after 3 failed checks (45s total)

// Track failed health checks per peer
const failedChecks = new Map<string, number>();

let monitorInterval: ReturnType<typeof setInterval> | null = null;

export function startPeerMonitoring() {
  if (monitorInterval) {
    console.log("Peer monitoring already running");
    return; // Already running
  }

  console.log("Starting peer health monitoring...");

  monitorInterval = setInterval(async () => {
    // Only check manual peers
    for (const [peerId, peerInfo] of store.manualPeers.entries()) {
      try {
        // Attempt to fetch device info
        await discoverHttpPeer({
          targetIp: peerInfo.ip,
          targetPort: peerInfo.port,
        });

        // Success - peer is alive, reset failure count
        if (failedChecks.has(peerId)) {
          console.log(`Peer ${peerId} is back online`);
          failedChecks.delete(peerId);
        }
      } catch (error) {
        // Failed to reach peer
        const failures = (failedChecks.get(peerId) || 0) + 1;
        failedChecks.set(peerId, failures);

        console.log(`Health check failed for ${peerId} (attempt ${failures}/${REMOVAL_GRACE_PERIOD})`);

        // Remove peer after grace period
        if (failures >= REMOVAL_GRACE_PERIOD) {
          console.log(`Removing unreachable peer ${peerId} after ${failures} failed checks`);
          store.manualPeers.delete(peerId);
          store.peers = store.peers.filter((p) => p.id !== peerId);
          failedChecks.delete(peerId);
        }
      }
    }
  }, HEALTH_CHECK_INTERVAL);
}

export function stopPeerMonitoring() {
  if (monitorInterval) {
    console.log("Stopping peer health monitoring...");
    clearInterval(monitorInterval);
    monitorInterval = null;
    failedChecks.clear();
  }
}
*/
