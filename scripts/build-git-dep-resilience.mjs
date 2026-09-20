// Builds the git-installed @cubiczan/resilience shim.
//
// npm skips `prepare` scripts for git dependencies installed from codeload
// tarballs (verified on npm 11), so the package's dist/ is not built during
// a plain `npm install`. This postinstall step detects the git-shim layout
// (node_modules/@cubiczan/resilience/typescript) and builds it. If the
// package ever moves to an npm registry install, the shim layout disappears
// and this step is a no-op by design.
import { execSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

const rel = "node_modules/@cubiczan/resilience/typescript";
if (existsSync(rel)) {
  // existsSync and execSync cwd both follow symlinks: a tampered install
  // could point the shim outside the workspace and get its build scripts
  // executed at the target. Resolve the real location and refuse to run
  // unless it stays inside the project root.
  const real = realpathSync(rel);
  const projectRoot = realpathSync(process.cwd());
  if (real !== projectRoot && !real.startsWith(projectRoot + path.sep)) {
    throw new Error(
      `refusing to build: ${rel} resolves outside the project root (${real})`,
    );
  }
  execSync("npm install --no-audit --no-fund && npm run build", {
    cwd: rel,
    stdio: "inherit",
  });
}
