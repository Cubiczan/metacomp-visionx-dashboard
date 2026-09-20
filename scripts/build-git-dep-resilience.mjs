// Builds the git-installed @cubiczan/resilience shim.
//
// npm skips `prepare` scripts for git dependencies installed from codeload
// tarballs (verified on npm 11), so the package's dist/ is not built during
// a plain `npm install`. This postinstall step detects the git-shim layout
// (node_modules/@cubiczan/resilience/typescript) and builds it. If the
// package ever moves to an npm registry install, the shim layout disappears
// and this step is a no-op by design.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const dir = "node_modules/@cubiczan/resilience/typescript";
if (existsSync(dir)) {
  execSync("npm install --no-audit --no-fund && npm run build", {
    cwd: dir,
    stdio: "inherit",
  });
}
