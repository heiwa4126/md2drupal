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
```

デフォルトでは、入力ファイルと同じディレクトリに拡張子を`.html`に変更したファイル名で出力します。

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
