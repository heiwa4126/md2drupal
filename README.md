# md2drupal (@heiwa4126/md2drupal)

[![NPM - Version](https://img.shields.io/npm/v/%40heiwa4126/md2drupal)
![NPM Type Definitions](https://img.shields.io/npm/types/%40heiwa4126%2Fmd2drupal)
![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/%40heiwa4126%2Fmd2drupal)](https://www.npmjs.com/package/%40heiwa4126/md2drupal)

Markdown から、ある特殊な Drupal 入力用の HTML に変換するツール。

[Unified](https://github.com/unifiedjs/unified) と TypeScript のパッケージングの練習でもある。

## install

```sh
npm install -g @heiwa4126/md2drupal
md2drupal --help
```

## usage

```bash
md2drupal <変換元のmarkdownファイル>
```

同じディレクトリに拡張子.html として変換する。

## 開発

```sh
pnpm i
pnpm run prepublishOnly
pnpm pack
# バージョニング
git add --all && git commit -am '...'
pnpm version patch
git push --follow-tags
# npmjs.com に発行
pnpm run build && pnpm publish --access=public
```
