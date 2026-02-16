# SellAuth Theme CLI

Official CLI tool for developing, syncing, and managing SellAuth themes locally.

## 🚀 Features

- 🔐 Login using your SellAuth API key
- 🎨 Create new themes
- 📥 Pull themes locally
- 📤 Push changes to SellAuth
- 👀 Live preview during development
- 🔄 Auto-reload on file changes
- 🌬 Built-in Tailwind CSS support
- ⚡ Watch mode with smart syncing

## 📦 Installation

Install globally:

`npm install -g sellauth-theme-cli`

## 🔑 Authentication

Login using your SellAuth API key:

`sellauth-theme login`

### Where to find your API key

Dashboard → Account → API Access
https://dash.sellauth.com/api

If you don’t see an API key, click **Regenerate**.

Your **Shop ID** can also be found on the same page.

## 🆔 Finding Your Theme ID

### Option 1: From Dashboard

Go to:

Storefront → Themes
https://dash.sellauth.com/theme

Click on the theme name.
You will be redirected to:

`https://dash.sellauth.com/theme/edit/<themeId>`

The number in the URL is your **Theme ID**.

### Option 2: Using the CLI (Recommended)

You can list all your shops and their theme IDs directly from the CLI:

`sellauth-theme list-ids`

This command will print:

- All shops on your account
- Their corresponding Shop IDs
- All themes within each shop
- Each theme’s Theme ID

This is the fastest way to retrieve both **Shop IDs** and **Theme IDs** without opening the dashboard.

## 🏬 Multiple Shops

If your account has multiple shops, you must specify:

`--shop <shopId>`

This argument is supported on all commands that interact with a shop.
If your account has only one shop, the CLI will use it automatically.

## 🎨 Create a Theme

Create a new theme:

`sellauth-theme create --name "My Theme"`

With optional template:

`sellauth-theme create --name "My Theme" --template main`

### Available Templates

Currently supported official templates:

- main
- pro
- blue

Options:

- `--name <name>`        Theme name (required)
- `--template <id>`      Official template ID (optional)
- `--shop <shopId>`      Required if multiple shops exist

## 📥 Pull Theme

Download theme files locally:

`sellauth-theme pull --theme <themeId> [--shop <shopId>]`

Options:

- `--theme <themeId>`    Theme ID (required)
- `--shop <shopId>`      Required if multiple shops exist

## 📤 Push Theme

Sync local theme to SellAuth:

`sellauth-theme push --theme <themeId> [--shop <shopId>]`

Options:

- `--theme <themeId>`    Theme ID (required)
- `--shop <shopId>`      Required if multiple shops exist

## 👀 Watch Mode (Recommended for Development)

Watch local theme and sync changes automatically:

`sellauth-theme watch --theme <themeId> [--shop <shopId>]`

This will:

- Generate a temporary preview token
- Display preview URL
- Watch for file changes
- Push updates automatically
- Reload preview page

Options:

- `--theme <themeId>`    Theme ID (required)
- `--shop <shopId>`      Required if multiple shops exist
- `--dir <directory>`    Themes directory (default: themes)
- `--template <name>`    Preview template (default: shop)

## 🎯 Apply Theme to Shop

Apply a theme to your shop:

`sellauth-theme apply --theme <themeId> [--shop <shopId>]`

Options:

- `--theme <themeId>`    Theme ID (required)
- `--shop <shopId>`      Required if multiple shops exist

## 🌬 Tailwind CSS Support

If your theme contains:

`tailwind.config.js`

The CLI automatically:

- Builds assets/style.css → assets/built.css
- Watches template files defined in `content`
- Pushes built CSS automatically
- Reloads preview

No need to install Tailwind inside the theme.

## 🛠 Requirements

- Node.js 18+
- SellAuth account
- SellAuth API key

## 🧠 License

MIT License