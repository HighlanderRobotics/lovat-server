# lovat-server

The backend server for [Lovat](https://lovat.app), a scouting system used to scout teams and matches in the First Robotics Competition

Developed by FRC [Team 8033](https://www.frc8033.com/), [@HighlanderRobotics](https://github.com/HighlanderRobotics)

## How to setup a dev server

### Prerequisites

- [Node.js v22.20.0](https://nodejs.org/en/download)
- [Git](https://git-scm.com/downloads) (latest version)
- [PostgreSQL](https://www.postgresql.org/download/) (latest version)

#### Recommended

- [Node Version Manager](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) (nvm) - makes it way easier to work with multiple node versions

### Step 1: Clone the repository from github

In your terminal, run

```bash
git clone https://github.com/HighlanderRobotics/lovat-server.
```

### Step 2: Install dependencies

Ensure you're using the correct version of Node.js and npm. If you have nvm, you can do this by running the following:

```bash
nvm install 22.20.0
nvm use
```

To install dependencies from package.json:

```bash
npm install
```

to get the correct version of node

### Step 3: Create a .env file

Find the `.env.example` file and make a copy. Rename it to `.env` and fill in the empty fields.

- In `DATABASE_URL` replace `username` with your username (the text to the left of the @ when you run a command), `password` with any random password, and `postgres` with `lovat-dev`.
- Get a TBA API key by [creating an account](https://www.thebluealliance.com/account) and getting a "READ API key". Paste the key into `TBA_KEY`
- Set `AUTH0_DOMAIN` to `lovat.us.auth0.com`
- You don't really need to fill in the other fields

### Step 4: Run the development server

Run

```bash
npm run dev
```

and your server should start. If you make any changes to a file and save, the server will restart automatically. To stop the server, press Ctrl + C

### Step 5 (optional): Import a database backup

The server will automatically populate matches, tournaments, etc, on initial startup. If having a larger set of data makes testing easier, you might be provided with a database dump containing a more realistic example of what the production database looks like. Obtain the file and run the following.

```bash
pg_restore -d "postgresql://YOUR_CONNECTION_STRING" /path/to/your/backup --clean --if-exists --no-owner

# example
pg_restore -d "postgresql://johndoe:mytopsecretpassword@localhost:5432/lovat_dev" ~/Downloads/lovat-backup-2025-12-25.dump --clean --if-exists --no-owner
```
