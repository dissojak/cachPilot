module.exports = {
  forbidden: [
    {
      name: 'domain-pur',
      severity: 'error',
      from: { path: '^packages/domain' },
      to: { path: 'node_modules/(@prisma|next|react)' },
    },
    {
      name: 'domain-no-app-infra',
      severity: 'error',
      from: { path: '^packages/domain' },
      to: { path: '^packages/(application|infra|db|ui|config)' },
    },
    {
      name: 'application-no-infra-db',
      severity: 'error',
      from: { path: '^packages/application' },
      to: { path: '^packages/(infra|db)' },
    },
    {
      name: 'application-no-next-react',
      severity: 'error',
      from: { path: '^packages/application' },
      to: { path: 'node_modules/(next|react)' },
    },
    {
      name: 'presentation-sans-orm',
      severity: 'error',
      from: { path: '^apps/web', pathNot: '^apps/web/src/container' },
      to: { path: '^packages/(db|infra)/' },
    },
  ],
};
