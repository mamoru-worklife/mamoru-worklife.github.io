# まもるの参加特典サイト

オープンチャット「仕事がしんどい会社員の、自分を守る働き方」の参加特典です。HTML・CSS・JavaScriptだけで動きます(ビルド不要)。

## ファイル
| ファイル | 中身 |
|---|---|
| index.html | トップ(サムネイル一覧) |
| t01-map.html 〜 t04-bunrei-kyushoku.html | 特典①〜④ |
| backup.html | チェックのバックアップと復元 |
| assets/css/tokens.css | 色・文字・余白 |
| assets/css/style.css | レイアウト |
| assets/js/main.js | 全ページ共通の動き(触らなくてよい) |
| assets/img/ | 画像 |
| .nojekyll | GitHub Pages の変換を止める空ファイル。消さない |

## GitHub Pages で公開する
1. まもる専用のGitHubアカウントで、リポジトリを作る。名前を `アカウント名.github.io` にすると、URLが `https://アカウント名.github.io/` になる(別の名前なら `https://アカウント名.github.io/リポジトリ名/`)
2. このフォルダの**中身**をすべてアップロードする(`.nojekyll` も含める)
3. リポジトリの Settings → Pages → 「Deploy from a branch」→ ブランチ `main`、フォルダ `/(root)` → Save
4. 数分後、上のURLで開けるか確かめる
5. URLが決まったら、各HTMLの `og:image` を `https://〜/assets/img/ogp.jpg` のような絶対URLに書き換える(LINEのプレビューは相対パスだと出ないことがある)

検索エンジンには出さない設定(`<meta name="robots" content="noindex, nofollow">`)を全ページに入れています。新しいページにも必ず入れてください。

## 画像を差し替える
サイトの画像は、軽くするためにWebP(OGPだけJPEG)にしています。生成した元のPNGは公開しない `../mamoru-work/original-images/` に置いています。
1. 生成した画像(PNG)を、`../mamoru-work/original-images/` の中の同じ名前の画像に上書きする
2. `python ../mamoru-work/optimize_images.py` を実行する
3. `assets/img/` に、最終サイズの `.webp`(OGPは `ogp.jpg`)ができる。比率が違う画像は切り抜かず、左右か上下に背景色を足す

## 特典を足す
1. `../mamoru-work/template-tokuten.html` をこのフォルダにコピーし、`t05-〇〇.html` に名前を変える(半角小文字・数字・ハイフンだけ)
2. `<body data-tokuten="t05">` の名前を、ほかの特典と重ならないものにする(チェックの保存先の名前になる)
3. 題名・本文・画像のパスを書き換える
4. index.html の `<li class="thumb-card">` を1つコピーして、リンク・画像・題名を書き換える
5. 前の特典の「次の特典」リンク(`.pager`)を足す

## チェック項目・文例を直す
- チェック項目は `<input ... data-check="名前">` の名前で保存しています
  - 文字だけ直す時 → 名前はそのまま(保存は残る)
  - 項目を足す時 → 新しい名前を付ける(既存のチェックはずれない)
  - 名前を変える・項目を消す時 → その項目の保存は消える
- 文例は `<p class="bunrei__text" id="b3">` の中を直す。コピーボタンは `data-copy="b3"` で同じ id を指す

## 保存の仕組み
- 特典ごとに `mamoru:t02:v1` のような名前で、ブラウザ(localStorage)に保存
- LINEの中のブラウザと、Safari・Chromeでは別々に保存される。バックアップ(backup.html)は、復元用URLとバックアップコードの2つ
