# Contributing

## Development Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Run linting (`pnpm run check`)
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Claude Reviews

Our CI automatically adds Claude review comments to PRs. You can also trigger a review by commenting `/claude-review` on any PR.

## Code Style

- TypeScript with strict mode
- Biome for formatting/linting
- No console.logs in production code
- Keep it simple and readable

## Testing

All new features should include tests. We use Vitest.

```bash
pnpm test        # Run tests
pnpm run test:ci # With coverage
```

## Commit Messages

We follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, missing semicolons, etc
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests
- `chore:` Maintain