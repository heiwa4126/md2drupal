# md2drupal (@heiwa4126/md2drupal)

[![NPM - Version](https://img.shields.io/npm/v/%40heiwa4126/md2drupal)
![NPM Type Definitions](https://img.shields.io/npm/types/%40heiwa4126%2Fmd2drupal)
![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/%40heiwa4126%2Fmd2drupal)](https://www.npmjs.com/package/%40heiwa4126/md2drupal)

Markdown から、ある特殊な Drupal 入力用の HTML に変換するツール。

[Unified](https://github.com/unifiedjs/unified) と TypeScript のパッケージングの練習でもある。

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
