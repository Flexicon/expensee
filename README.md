# expensee

A CLI tool for tracking monthly expense statuses via Google Sheets.

## Installation

```bash
deno task build:install
```

This compiles the binary and installs it to `~/.local/bin`.

## Setup

Run the config command to set your Google Sheet ID and service account credentials:

```bash
expensee config
```

Credentials are stored in `~/.config/expensee/`.

## Usage

```
expensee [command] [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-s, --sheetId` | Google Sheet ID (overrides saved config) |
| `-m, --month` | Month name (defaults to current month) |

**Commands:**

| Command | Description |
|---------|-------------|
| `status` | Show expense statuses for the month (default) |
| `mark <keys...>` | Mark one or more expenses as done (✔) |
| `clear <keys...>` | Clear one or more expense statuses |
| `snooze <keys...>` | Snooze one or more expenses (X) |
| `config` | Manage configuration (`--list`, `--reset`) |

**Valid keys:** `apartment`, `mortgage`, `electric`, `internet`, `hetzner`, `taxes`, `invoices`

## Examples

```bash
expensee                          # show current month status
expensee status --month march     # show March status
expensee mark apartment           # mark apartment as paid
expensee mark apartment internet  # mark multiple as paid
expensee snooze taxes --month april
expensee clear apartment internet taxes
```

## Requirements

- [Deno](https://deno.land/)
- A Google Sheet with expense data
- A Google service account with Sheets API access
