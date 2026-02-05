# Security Test Site (Fixture)

Browser-based attack suite for the site builder proxy. Tests iframe sandbox,
same-origin isolation, WebSocket origin checks, and capability restrictions.

## Usage

Copy to the Zoya projects directory, install, and open in the Sites page:

```sh
cp -r src/sites/fixtures/security-test-site ~/.zoya/projects/security-test
cd ~/.zoya/projects/security-test
bun install
git init && git add -A && git commit -m "init"
```

Then open the Zoya dashboard, go to Sites, and start the `security-test` project.
All 28 tests should show **BLOCKED**.

