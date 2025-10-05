# lovat-server

The backend server for [Lovat](https://lovat.app), a scouting system used to scout teams and matches in the First Robotics Competition

Developed by FRC [Team 8033](https://www.frc8033.com/), [@HighlanderRobotics](https://github.com/HighlanderRobotics)

## How to setup a dev server

### Prerequisites

- [Node.js v22.20.0](https://nodejs.org/en/download)
- [Git](https://git-scm.com/downloads) (obviously)
- [PostgreSQL](https://www.postgresql.org/download/)

#### Recommended

- [Node Version Manager](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) (nvm) - makes it way easier to work with multiple node versions
- [_VS Code_](https://code.visualstudio.com/) with **ESLint** and **Prisma** extensions

### Step 1: Clone the repository from github

Open VS Code and press `Clone Git Repository`. Then paste this URL into the box at the top of the screen: https://github.com/HighlanderRobotics/lovat-server. Next, choose a folder to clone it into, then press `Open in New Window`.

### Step 2: Install dependencies

In VS Code, press Ctrl (Mac) or Command (Windows) + `. This should open the terminal. Now run

```bash
npm install
```

This will install all the dependencies for the project. If you're using nvm, make sure to run

```bash
nvm install 22.20.0
nvm use
```

to get the correct version of node

### Step 3: Create a .env file

Find the `.env.example` file and make a copy. Rename it to `.env` and fill in the empty fields.

- In `DATABASE_URL` replace `username` with your username (the text to the left of the @ when you run a command), `password` with any random password, and `postgres` with `lovat-dev`.
- Get a TBA API key by [creating an account](https://www.thebluealliance.com/account) and getting a `READ API key`. Paste the key into `TBA_KEY`
- Set `AUTH0_DOMAIN` to `lovat.us.auth0.com`
- You don't really need to fill in the other fields

### Step 4: Run the development server

Run

```bash
npm run dev
```

and your server should start. If you make any changes to a file and save, the server will restart automatically. To stop the server, press Ctrl + C

### Step 5: Import a database backup

Download a [backup of the database]() and run

```bash
pg_restore -d "YOUR_DATABASE_URL" /path-to-your-backup --clean --if-exists --no-owner

# example
pg_restore -d "postgresql://johndoe:mytopsecretpassword@localhost:5432/lovat_dev" /Users/johndoe/Downloads/lovat-backup-2025-12-25.dump --clean --if-exists --no-owner
```
