# md2drupal (@heiwa4126/md2drupal)

Markdown から ある特殊な Drupal 入力用の HTML に変換するツール

[Unified](https://github.com/unifiedjs/unified) と TypeScript のパッケージングの練習でもある。

## install

```sh
npm install @heiwa4126/md2drupal
md2drupal --help
```

## usage

```shell
md2drupal <変換元のmarkdownファイル>
```

同じディレクトリに 拡張子.html として変換する。

## 開発

```sh
pnpm i
pnpm run watch &
## ./src の下をいろいろ編集する。 ./dist に出来る
pnpm run lint
pnpm run lint:package
pnpm run format
pnpm test # TODO:testまだ書いてないです
# まずローカルに発行して試す。1個上にtarballできる。よそのプロジェクトでnpm i foo.tgzする
pnpm run pack
# バージョニング
git add --all && git commit -am '...'
pnpm version patch
git push && git push --tags
# npmjs.com に発行
npm run build && npm publish --access=public
```
