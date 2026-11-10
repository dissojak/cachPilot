/** Architecture guard rules (course s.45): the layer graph becomes a test. */
module.exports = {
  forbidden: [
    {
      name: 'domain-pure',
      severity: 'error',
      comment: 'domain imports nothing: no mongoose/mongodb/zod/next/react, no sibling packages, no apps',
      from: { path: '^packages/domain' },
      to: {
        path:
          '(^|/node_modules/)(mongoose|mongodb|zod|next|react|next-auth)(/|$)|node_modules/@cashpilot/(application|infra|db|ui|config)|^packages/(application|infra|db|ui|config)|(^|(\\.\\./)+)apps/',
      },
    },
    {
      name: 'application-only-domain',
      severity: 'error',
      comment: 'application may import only @cashpilot/domain; no mongoose/mongodb/zod/next/react, no apps',
      from: { path: '^packages/application' },
      to: {
        path:
          '(^|/node_modules/)(mongoose|mongodb|zod|next|react|next-auth)(/|$)|node_modules/@cashpilot/(infra|db|ui)|^packages/(infra|db|ui)|(^|(\\.\\./)+)apps/',
      },
    },
    {
      name: 'infra-no-presentation',
      severity: 'error',
      comment: 'infra is an adapter: never next/react/next-auth, never an app',
      from: { path: '^packages/infra' },
      to: { path: '(^|/node_modules/)(next|react|next-auth)(/|$)|(^|(\\.\\./)+)apps/' },
    },
    {
      name: 'only-infra-imports-db',
      severity: 'error',
      comment: 'only packages/infra and packages/db may import packages/db (course s.44)',
      from: { pathNot: '^packages/(infra|db)' },
      to: { path: '^packages/db|node_modules/@cashpilot/db' },
    },
    {
      name: 'web-no-infra-except-container',
      severity: 'error',
      comment: 'only the composition root (apps/web/src/container) may import @cashpilot/infra',
      from: { path: '^apps/web', pathNot: '^apps/web/src/container' },
      to: { path: '^packages/infra|node_modules/@cashpilot/infra' },
    },
    {
      name: 'web-no-domain',
      severity: 'error',
      comment: 'presentation uses the application package (use cases, DTOs, error re-exports), never the domain (D12)',
      from: { path: '^apps/web' },
      to: { path: '^packages/domain|node_modules/@cashpilot/domain' },
    },
    {
      name: 'packages-no-apps',
      severity: 'error',
      comment: 'a package never depends on an app',
      from: { path: '^packages' },
      to: { path: '(^|(\\.\\./)+)apps/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'no circular dependencies',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // eslint.config.js files are dev tooling that legitimately imports the shared
    // config package; they are not part of the runtime layer graph.
    exclude: { path: '(\\.next|dist|coverage|\\.turbo|(^|/)eslint\\.config\\.js$)' },
    // NOTE: no `tsConfig` option — the shared base tsconfig has no include list
    // (each package extends it with its own `include: ["src"]`), and dependency-cruiser
    // supports only one file. Workspace resolution works through package.json `exports`.
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
