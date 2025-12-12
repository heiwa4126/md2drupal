# md2drupal (@heiwa4126/md2drupal)

[![NPM - Version](https://img.shields.io/npm/v/%40heiwa4126/md2drupal)
![NPM Type Definitions](https://img.shields.io/npm/types/%40heiwa4126%2Fmd2drupal)
![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/%40heiwa4126%2Fmd2drupal)](https://www.npmjs.com/package/%40heiwa4126/md2drupal)

Markdown から、ある特殊な Drupal 入力用の HTML に変換するツール。

[Unified](https://github.com/unifiedjs/unified) と TypeScript のパッケージングの練習でもある。

## メモ: chokidar の件

[Provenance is missing in 4.0.2 & 4.0.3 · Issue #1440 · paulmillr/chokidar](https://github.com/paulmillr/chokidar/issues/1440)
の件で、package.json に

```json
	"pnpm": {
		"overrides": {
			"chokidar": "4.0.1"
		}
	},
```

が入ってます。tsup が chokidar@5 依存になったら取る。tsdown にする手もある

他参考: [(1) X ユーザーの pnpm さん: 「We have discovered that chokidar has switched off provenance a year ago and now it fails with the trustPolicy setting set to no-downgrade. We'll need to think about a way to deal with these cases. https://t.co/fSEJQYWr1e」 / X](https://x.com/pnpmjs/status/1987836672705237243)

## Install

```sh
npm install -g @heiwa4126/md2drupal
md2drupal --help
# or
npx @heiwa4126/md2drupal --help
```

## Usage

```bash
md2drupal <変換元のmarkdownファイル> [options]

# 例: 同じディレクトリに拡張子.htmlとして変換
md2drupal input.md

# 出力先を指定
md2drupal input.md -o output.html
md2drupal input.md --output /path/to/output.html

# GitHub Markdown CSS付きでスタンドアロンHTMLとして出力
md2drupal input.md --css
md2drupal input.md -c -o preview.html
```

デフォルトでは、入力ファイルと同じディレクトリに拡張子を`.html`に変更したファイル名で出力します。

### オプション

- `-o, --output <file>` - 出力 HTML ファイルのパス
- `-c, --css` - GitHub Markdown CSS を CDN から読み込むリンクを追加（スタンドアロン HTML プレビュー用）

## 機能

### 自動タイトル生成

変換される HTML の `<title>` タグは、Markdown ファイル内の最初のヘッダ要素（h1-h6）のテキストから自動的に生成されます。

```markdown
# プロジェクトのドキュメント

本文...
```

↓ 変換後

```html
<!DOCTYPE html>
<html>
  <head>
    <title>プロジェクトのドキュメント</title>
  </head>
  <body>
    <h1 id="プロジェクトのドキュメント">プロジェクトのドキュメント</h1>
    ...
  </body>
</html>
```

- ヘッダ内のインライン要素（リンク、強調など）はプレーンテキストとして抽出されます
- ヘッダが見つからない場合は、デフォルトで `"Converted HTML"` が使用されます

### YAML Front Matter サポート

Markdown ファイルの先頭に YAML Front Matter を記述することで、HTML の `<meta>` タグを自動生成できます。

```markdown
---
description: "この記事の説明文"
keywords:
  - markdown
  - drupal
  - html
author: "著者名"
---

# 記事のタイトル

本文...
```

↓ 変換後の `<head>` 内

```html
<head>
  <meta charset="utf-8" />
  <title>記事のタイトル</title>
  <meta name="description" content="この記事の説明文" />
  <meta name="keywords" content="markdown, drupal, html" />
  <meta name="author" content="著者名" />
</head>
```

**対応フィールド**:

- `description` - `<meta name="description">` タグとして出力
- `keywords` - 文字列または配列（配列の場合はカンマ区切りに変換）。`<meta name="keywords">` タグとして出力
- `author` - `<meta name="author">` タグとして出力

**セキュリティ**: すべてのメタタグの content 属性値は HTML エスケープされます（XSS 対策）。

**エラーハンドリング**: YAML Front Matter のパースに失敗した場合、警告を stderr に出力し、Front Matter 全体を無視して変換を続行します。

### 文字エンコーディング

全ての HTML 出力に `<meta charset="utf-8">` タグが自動的に追加されます（`<head>` の最初の要素）。

### スタイル付きプレビュー（`--css`オプション）

`--css`（または`-c`）オプションを使用すると、GitHub Markdown CSS を含むスタンドアロン HTML ファイルとして出力します。これはブラウザで直接開いてプレビューする場合に便利です。

```bash
md2drupal document.md --css
```

このオプションを指定すると、以下が追加されます：

- GitHub Markdown CSS（CDN: `https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css`）
- `<body>`タグに`class="markdown-body"`属性
- `<body>`タグに`padding: 1.5em`のインラインスタイル

**注意**: デフォルト（CSS なし）の出力は Drupal CMS への貼り付け用です。`--css`オプションはスタンドアロン HTML プレビュー専用として使用してください。

## 開発

```sh
pnpm i
pnpm run prepublishOnly

# バージョニング
git add --all && git commit -am '...'
pnpm version patch
git push --follow-tags

# npmjs.com に発行
pnpm publish --access=public
```
