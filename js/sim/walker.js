// Shared movement for anyone who walks along a path (the shopkeeper, customers).
// An agent is { x, z, facing, path: [{x, z}, ...] } in room-local coordinates.

/** Advance along the path. Returns true on the step the agent reaches the end of it. */
export function stepAlong(agent, speed, dt) {
  if (!agent.path.length) return false;
  let step = speed * dt;
  while (step > 0 && agent.path.length) {
    const p = agent.path[0];
    const dx = p.x - agent.x, dz = p.z - agent.z, d = Math.hypot(dx, dz);
    if (d > 1e-4) agent.facing = Math.atan2(dx, dz);
    if (d <= step) {
      agent.x = p.x;
      agent.z = p.z;
      step -= d;
      agent.path.shift();
    } else {
      agent.x += (dx / d) * step;
      agent.z += (dz / d) * step;
      step = 0;
    }
  }
  return agent.path.length === 0;
}
