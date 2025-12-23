# Contributing to Sabine

First off, thank you for considering contributing to Sabine! We welcome any help, from reporting bugs to submitting new features.

Sabine is an open-source project dedicated to providing a top-tier esports coverage and simulation experience on Discord.

## How Can I Contribute?

### Reporting Bugs

* Ensure the bug hasn't already been reported by searching on GitHub under [Issues](https://github.com/sabinelab/sabine/issues).
* If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/sabinelab/sabine/issues/new). Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an explicit set of steps to reproduce the issue.

### Suggesting Enhancements

* Open a new issue to discuss your enhancement. Clearly state the feature you'd like to see and why it would be beneficial.

### Pull Requests

1.  **Fork** the repository.
2.  **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/sabine.git`
3.  Create a new **branch** for your changes: `git checkout -b my-feature-branch`
4.  Make your changes.
5.  **Lint** your code: `bun lint`. Please ensure your code adheres to the project's Biome rules.
6.  **Commit** your changes with a descriptive message.
7.  **Push** your branch to your fork: `git push origin my-feature-branch`
8.  Open a **Pull Request** to the `main` branch of the main repository.

## Development Setup

To get Sabine running locally, you'll need [Bun](https://bun.sh/), [Docker](https://www.docker.com/), and [Docker Compose](https://docs.docker.com/compose/).

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/sabine.git
    cd sabine
    ```

2.  **Install dependencies:**
    ```bash
    bun i --frozen-lockfile
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory. You can use `src/env.ts` as a template for the required variables. You must provide values for:
    * `BOT_TOKEN`: Your Discord bot token.
    * `POSTGRES_URI`: The connection string for your PostgreSQL database.
    * `REDIS_URL`: The URL for your Redis instance.
    * `AUTH`: Auth key for the internal API.
    * ...and other variables defined in `src/env.ts`.

    *Note: The `docker-compose.yml` file is configured to start the **Redis** service via `docker compose up -d redis`. You must provide your own PostgreSQL database container. You can use [this repository as an example](https://github.com/levisantosp/postgres) for a quick setup.*

4.  **Sync the database:**
    Run the Prisma push command to sync your schema with the database.
    ```bash
    bun push
    ```

5.  **Run the bot in development (watch) mode:**
    This command will start the bot and watch for file changes.
    ```bash
    bun dev
    ```

## Code Style

This project uses Biome and TypeScript. Before committing, please run `bun lint` to check for any style issues and fix them.

## License

By contributing, you agree that your contributions will be licensed under the **GNU AGPL v3.0 License** that governs the project.
