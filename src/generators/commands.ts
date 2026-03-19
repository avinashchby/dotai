import type { PackageManager } from '../types.js';

/** Standard dev commands keyed by package manager. */
interface Commands {
  install: string;
  build: string;
  test: string;
  lint: string;
  format: string;
}

const PM_COMMANDS: Record<string, Commands> = {
  npm: {
    install: 'npm install',
    build: 'npm run build',
    test: 'npm test',
    lint: 'npm run lint',
    format: 'npm run format',
  },
  yarn: {
    install: 'yarn',
    build: 'yarn build',
    test: 'yarn test',
    lint: 'yarn lint',
    format: 'yarn format',
  },
  pnpm: {
    install: 'pnpm install',
    build: 'pnpm build',
    test: 'pnpm test',
    lint: 'pnpm lint',
    format: 'pnpm format',
  },
  bun: {
    install: 'bun install',
    build: 'bun build',
    test: 'bun test',
    lint: 'bun lint',
    format: 'bun format',
  },
  cargo: {
    install: 'cargo build',
    build: 'cargo build',
    test: 'cargo test',
    lint: 'cargo clippy',
    format: 'cargo fmt',
  },
  go: {
    install: 'go mod download',
    build: 'go build ./...',
    test: 'go test ./...',
    lint: 'golangci-lint run',
    format: 'gofmt -w .',
  },
  pip: {
    install: 'pip install -r requirements.txt',
    build: 'python setup.py build',
    test: 'pytest',
    lint: 'ruff check .',
    format: 'ruff format .',
  },
  uv: {
    install: 'uv sync',
    build: 'uv build',
    test: 'uv run pytest',
    lint: 'uv run ruff check .',
    format: 'uv run ruff format .',
  },
  poetry: {
    install: 'poetry install',
    build: 'poetry build',
    test: 'poetry run pytest',
    lint: 'poetry run ruff check .',
    format: 'poetry run ruff format .',
  },
  bundler: {
    install: 'bundle install',
    build: 'bundle exec rake build',
    test: 'bundle exec rspec',
    lint: 'bundle exec rubocop',
    format: 'bundle exec rubocop -a',
  },
  composer: {
    install: 'composer install',
    build: 'composer run build',
    test: 'composer run test',
    lint: 'composer run lint',
    format: 'composer run format',
  },
  maven: {
    install: 'mvn install',
    build: 'mvn compile',
    test: 'mvn test',
    lint: 'mvn checkstyle:check',
    format: 'mvn spotless:apply',
  },
  gradle: {
    install: 'gradle build',
    build: 'gradle build',
    test: 'gradle test',
    lint: 'gradle check',
    format: 'gradle spotlessApply',
  },
  dotnet: {
    install: 'dotnet restore',
    build: 'dotnet build',
    test: 'dotnet test',
    lint: 'dotnet format --verify-no-changes',
    format: 'dotnet format',
  },
};

/** Return dev commands for a given package manager, or sensible fallback. */
export function getCommands(pm: PackageManager | null): Commands {
  if (pm && PM_COMMANDS[pm]) {
    return PM_COMMANDS[pm];
  }
  return {
    install: '',
    build: '',
    test: '',
    lint: '',
    format: '',
  };
}
