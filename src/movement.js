// Camera looks down -Z at yaw 0. Positive X is to the camera's right.
export function movementVector(yaw, forward, strafe) {
  const length = Math.max(1, Math.hypot(forward, strafe));
  return {
    x: (-Math.sin(yaw) * forward + Math.cos(yaw) * strafe) / length,
    z: (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) / length
  };
}
