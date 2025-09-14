# Study-Plus

学習管理Webアプリ「StudyGraph V2」設計書（HTML/CSS/JS・GitHub Pages・個人用）

0. 目的・前提
	•	対象: 本人のみ（単ユーザー、認証不要）
	•	ホスティング: GitHub Pages（静的配信のみ、サーバー処理なし）
	•	使用技術: HTML / CSS / JavaScript（フレームワーク不使用、必要最小限のCDNライブラリは許容）
	•	コンセプト:
	•	「Vulpe 風」＝日々の学習計画（ページ数・問数）をグラフ化し、当日や週のタスクを明確化
	•	「Studyplus 風」＝実績（ページ／問／時間）を自動集計して推移グラフ・ランキング・連続記録などを可視化
	•	UIはV2として洗練されたモバイル前提のビジュアル（iPhone/ iPad横向きもモバイル扱い）
	•	データはIndexedDBとlocalStorageに保存。画像はIndexedDB（Base64/Blob）
	•	バックアップ/リストア（JSONエクスポート/インポート）を搭載
	•	参考書の複数登録、表紙画像と名称登録可能

⸻

1. 画面構成（情報設計）

1.1 ルーティング（ハッシュベースSPA）
	•	#/dashboard ダッシュボード（本日の計画・進捗、クイック入力、ハイライト）
	•	#/planner プランナー（カレンダー＋日/週計画表、ドラッグで目標設定）
	•	#/logs ログ入力・一覧（フォーム＋テーブル、写真サムネ付き）
	•	#/library 参考書ライブラリ（登録・編集・並び替え）
	•	#/analytics 分析（折れ線/棒/円グラフ、科目別・参考書別・期間比較）
	•	#/settings 設定（テーマ、データ管理、バックアップ/復元、表示フォーマット）
	•	#/about アプリ情報（バージョン、ショートカット、免責）

1.2 主要ビューの内容

ダッシュボード
	•	今日の計画（ページ/問の目標 vs 進捗、ゲージ）
	•	今日の入力クイックフォーム（参考書選択、ページ/問、時間、メモ、✓保存）
	•	今週の進捗サマリ（合計ページ・問・時間、達成率、連続達成日数）
	•	直近7日グラフ（棒：日別達成率、折れ線：累計時間）
	•	未入力アラートと「ワンタップで前日の続きから」CTA

プランナー
	•	月/週切替カレンダー
	•	日付セルに**目標値（p=ページ/q=問）**バッジ表示
	•	日/週編集パネル（当日の目標ページ/問、優先度、タグ、締切）
	•	参考書別の配分表（総ページ→日割、休養日、自動配分ロジック）
	•	ドラッグで目標コピー、右クリックで消去、ショートカット（例: Shift+↑↓で±5ページ）

ログ
	•	入力フォーム（日時、参考書、ページFrom-Toまたは問数、学習時間、メモ、画像添付）
	•	実績一覧（ソート/フィルタ：日付/参考書/科目/タグ、編集・削除）
	•	画像はサムネ（クリックでライトボックス）

ライブラリ
	•	参考書カード一覧（表紙画像、タイトル、副題、科目、総ページ、総問数、難易度、発行年）
	•	新規/編集モーダル（名称、科目、総ページ/問、写真アップロード、色タグ、購入日）
	•	並び替え（利用頻度、最近使用、科目、難易度）

分析
	•	期間選択（クイック: 7日/30日/90日/半年/1年、カスタム）
	•	グラフ:
	•	参考書別実績（棒スタック：ページ/問/時間）
	•	日別達成率（棒）＋移動平均
	•	科目別割合（ドーナツ）
	•	累積ページ/問（折れ線、目標線と比較）
	•	連続学習日（ヒートマップ）
	•	テーブル要約（トップ参考書、トップ科目、平均勉強時間、標準偏差）

設定
	•	テーマ（ライト/ダーク/自動、アクセントカラー）
	•	表示単位（ページ/問の優先、時間の表示形式）
	•	バックアップ（JSONエクスポート、ローカルファイルに保存）
	•	復元（JSONインポート、差分マージまたは上書き）
	•	データ初期化（要二重確認）
	•	ライブラリ画像のストレージ使用量表示

⸻

2. 情報モデル（データ設計）

2.1 スキーマ（正規化）

{
  "Book": {
    "id": "string", 
    "title": "string",
    "subtitle": "string",
    "subject": "string",
    "totalPages": 0,
    "totalQuestions": 0,
    "difficulty": 1,
    "color": "#5566ff",
    "coverImageId": "string|null",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "tags": ["string"]
  },
  "Plan": {
    "id": "string",
    "date": "YYYY-MM-DD",
    "items": [
      {
        "bookId": "string",
        "targetPages": 0,
        "targetQuestions": 0,
        "priority": 0,
        "notes": "string"
      }
    ],
    "frozen": false
  },
  "Log": {
    "id": "string",
    "datetime": "ISO8601",
    "bookId": "string",
    "fromPage": 0,
    "toPage": 0,
    "questions": 0,
    "minutes": 0,
    "memo": "string",
    "photoId": "string|null",
    "tags": ["string"]
  },
  "Image": {
    "id": "string",
    "blob": "(Blob in IndexedDB)",
    "type": "image/png|image/jpeg",
    "width": 0,
    "height": 0,
    "size": 0
  },
  "Prefs": {
    "theme": "light|dark|auto",
    "accent": "#color",
    "firstDayOfWeek": 0,
    "timeFormat": "h:mm|HH:mm",
    "displayUnit": "page-first|question-first"
  }
}

2.2 派生・集計
	•	日別実績 = sum(Log where date==d)
	•	参考書別期間実績 = groupBy(bookId) sum(pagesDiff, questions, minutes)
	•	達成率（その日）= sum(actual)/sum(target), actualはページ換算と問換算を重み付け（設定で比率変更可、既定: ページ=1, 問=1）
	•	連続日数 = 直近から連続でminutes>0が続く日数
	•	予定超過/不足 = 実績−目標（負は不足）

2.3 ストレージ層
	•	IndexedDB（DB名: studygraph_v2）
	•	books, plans, logs, images, meta
	•	localStorage
	•	prefs, version, lastBackupAt
	•	画像はimagesにBlob保存。カード表示はキャッシュURL（URL.createObjectURL）使用。

⸻

3. ライブラリ方針（CDN）
	•	チャート: Chart.js v4（軽量・拡張十分）
	•	カレンダーUI: ネイティブ＋自作（日/週/月）
	•	IndexedDBユーティリティ: idb-keyval（薄いラッパ）
	•	アイコン: SVGスプライト（自前）

※ ライブラリは<script defer src="...">で読み込み。オフライン対応のため、必要なら将来/vendor/にピン留め（SRI付）。

⸻

4. UI設計（V2デザインシステム）

4.1 レイアウト
	•	AppShell: ヘッダー固定＋ボトムタブ（モバイル）/サイドバー（タブレット以上）
	•	コンテンツ幅: 720px基準（モバイル最大幅）、タブレットで 960–1200px
	•	スクロール: 本文のみ。ヘッダー・タブ固定
	•	安全領域: iOSセーフエリア（env(safe-area-inset-*)）利用

4.2 カラートークン（CSS変数）
	•	--bg, --surface, --text, --muted, --primary, --accent, --warn, --ok, --grid
	•	ライト:
	•	--bg: #0b0c10;（ダーク前提のプロ感を優先。※ライトは反転テーマ）
	•	ダーク: --bg: #0b0c10; --surface: #111318; --text: #e7e8ee; --muted: #9aa1b2; --primary: #6aa3ff; --accent: #8b5cf6; --warn: #f59e0b; --ok: #22c55e; --grid:#20232b
	•	コントラスト比は4.5:1以上で調整

4.3 タイポグラフィ
	•	見出し: Inter + Noto Sans JP（フォールバック: system-ui）
	•	文字サイズスケール: 12 / 14 / 16 / 18 / 20 / 24 / 28
	•	行間: 1.4〜1.6

4.4 コンポーネント（命名はBEM）
	•	app-header（左ロゴ、右クイック追加）
	•	nav-tabs（dashboard / planner / logs / library / analytics / settings）
	•	card（card--kpi, card--form, card--chart）
	•	form-field（input, select, number, file, tags）
	•	button（button--primary, --ghost, --danger, --icon）
	•	modal, toast, empty, badge, chip, progress
	•	calendar（calendar--month, --week）
	•	chart-container
	•	book-card（表紙、タイトル、科目チップ、総ページ/問）

4.5 状態・フィードバック
	•	主要アクションはトースト通知
	•	フォームエラーはフィールド下テキスト＋赤枠
	•	保存中はボタンをロードスピナーに変形
	•	重要操作（削除/初期化）は二段確認（ダイアログ→タイプ入力）

4.6 キーボード・操作性
	•	参考書選択はクイック検索（/でフォーカス）
	•	日付ナビ（←/→）週移動、tで今日
	•	計画値±5（Shift+↑/↓）

⸻

5. 機能仕様（ユースケース・フロー）

5.1 参考書登録
	•	入力: 画像（任意）、名称（必須）、科目、総ページ/総問、色タグ
	•	保存: booksに登録→画像はimagesへBlob保存→coverImageId紐付け
	•	成功: トースト「参考書を追加しました」

5.2 計画作成
	•	期間と対象参考書を選択→自動配分（例: 休養日を除いて均等割）
	•	手動調整（セル編集・ドラッグコピー）
	•	保存: plansに日付単位で格納、同日の既存は置換/マージ選択

5.3 ログ入力
	•	参考書、ページFrom-Toまたは問数、学習時間、メモ、写真（任意）
	•	保存後に「前回の続き」候補を提案
	•	自動: 当日の達成率を再計算、ダッシュボードに反映

5.4 分析
	•	期間を指定→各集計を実行→チャート描画
	•	チャートクリックで該当ログ/参考書へ遷移（ハイライト）

5.5 バックアップ/リストア
	•	エクスポート: books/plans/logs/images(metaは除く)/prefsをJSON化
	•	画像はBase64に変換（または別ファイル打ち出しも選択肢）
	•	インポート: ファイル選択→上書き or マージ選択→適用

⸻

6. 非機能要件
	•	パフォーマンス: 初期ロード < 1.5s（モバイル4G想定）、遅延ロード
	•	オフライン: 全機能オフライン動作（PWA化はV3）
	•	アクセシビリティ: キー操作可能、aria属性付与、コントラスト遵守
	•	信頼性: 重要保存処理はtry/catch＋再試行
	•	データサイズ: 画像合計50〜150MB程度を目安に容量警告

⸻

7. 画面別UIワイヤー（テキスト仕様）

7.1 ダッシュボード
	•	上段: KPIカード（今日の達成率ゲージ、今日の合計分、今週合計）
	•	中段: クイック入力（参考書選択・ページ/問・時間・保存）
	•	下段: 「7日達成率」棒グラフ＋「累積時間」折れ線

7.2 プランナー（週）
	•	左: 参考書配分リスト（目標合計、残り）
	•	右: 週グリッド（Mon–Sun、セルにp/q表示）
	•	フッター: 行操作（±5、コピー、クリア）

7.3 ログ
	•	フォーム: 日時、参考書、from/to、問、時間、メモ、写真、保存
	•	一覧: 日付降順カード、編集/削除、サムネ

7.4 ライブラリ
	•	グリッドカード：表紙、タイトル、科目、総ページ/問、最終使用日
	•	FAB: 追加ボタン

7.5 分析
	•	期間ツールバー→チャート4種＋テーブル

7.6 設定
	•	テーマ切替トグル、アクセントカラー選択
	•	バックアップ/復元ボタン、初期化

⸻

8. DOM ID / クラス命名規約（Codex連携を意識した決め打ち）

8.1 ルート
	•	#app, #view-dashboard, #view-planner, #view-logs, #view-library, #view-analytics, #view-settings

8.2 主要操作要素
	•	参考書セレクト: #input-book
	•	ページ入力: #input-from-page, #input-to-page
	•	問数入力: #input-questions
	•	時間入力: #input-minutes
	•	保存ボタン: #btn-save-log
	•	計画保存: #btn-save-plan
	•	バックアップ: #btn-export-json
	•	復元: #btn-import-json

8.3 チャートコンテナ
	•	#chart-daily-rate, #chart-weekly-summary, #chart-book-breakdown, #chart-subject-pie, #chart-cumulative

⸻

9. 状態管理（シングルトンStore）

9.1 Store構造

{
  "state": {
    "books": [],
    "plansByDate": {},
    "logs": [],
    "prefs": {},
    "ui": {
      "route": "#/dashboard",
      "loading": false,
      "modal": null,
      "toast": null,
      "range": {"from":"YYYY-MM-DD","to":"YYYY-MM-DD"}
    }
  }
}

9.2 イベント（Pub/Sub）
	•	BOOKS_CHANGED, PLANS_CHANGED, LOGS_CHANGED, PREFS_CHANGED, ROUTE_CHANGED
	•	変更時にビューが再描画

⸻

10. バリデーション仕様
	•	参考書: title必須、totalPages/totalQuestionsは0以上整数
	•	ログ: bookId必須、from<=to、minutes>=0、pages or questionsの少なくとも一方>0
	•	計画: targetPages/Questionsは0以上、1日の合計が極端に過大の場合は警告

⸻

11. 計画自動配分（アルゴリズム仕様）
	•	入力: 参考書（総ページ/問）、期間（from-to）、休養日、既存ログからの進捗残を差し引き
	•	手順:
	1.	有効日数 = 期間の日数−休養日
	2.	残量 = max(総−実績, 0)
	3.	基本割当 = floor(残量/有効日数)
	4.	余りを前半日から順に+1配分
	5.	すでに手動設定済セルは上書きしない（オプションで上書き可）

⸻

12. グラフ仕様（Chart.js）

12.1 日別達成率
	•	データ: 直近N日、actual/target*100（target=0はnull）
	•	視覚: 棒、目標線100%破線、当日は強調

12.2 参考書別実績
	•	データ: 期間内の参考書ごとの合計（ページ、問、時間）
	•	視覚: スタック棒（ページ/問/時間）

12.3 科目別割合
	•	データ: 期間内合計時間（またはポイント換算）
	•	視覚: ドーナツ、ホバーで内訳

12.4 累積
	•	データ: 日別合計の累積（ページ/問）
	•	視覚: 折れ線2本（計画累積と実績累積）

12.5 連続学習ヒートマップ
	•	データ: 年カレンダー配列、日毎の分（0〜X）を濃淡

⸻

13. 画像取扱い仕様
	•	受付: png/jpg、最大長辺2048pxにクライアントリサイズ（Canvas）
	•	保存: IndexedDB（Blob）、カード表示はobjectURL、必要に応じてキャッシュ破棄
	•	容量警告: 合計50MB超で通知

⸻

14. アクセシビリティ & 国際化
	•	aria-label/role徹底、フォーカス可視
	•	日本語UI固定、将来i18n切替余地あり
	•	数値入力はinputmode="numeric"採用

⸻

15. セキュリティ/プライバシ
	•	外部送信なし、個人端末内保存。バックアップファイルは自己管理
	•	GitHub Pagesへのコミットに個人データを含めない（エクスポートは手元保存）

⸻

16. フォルダ構成（GitHub Pages）

/ (root)
  index.html
  /assets
    /css
      base.css
      layout.css
      components.css
      theme-dark.css
      theme-light.css
    /js
      app.js
      store.js
      db.js
      charts.js
      calendar.js
      router.js
      ui.js
      util.js
      export.js
      import.js
    /icons
      sprite.svg
    /vendor
      chart.umd.min.js
      idb-keyval-iife.min.js
  /docs  （任意：仕様・メモ）


⸻

17. テスト項目（要点）

17.1 機能
	•	参考書の追加/編集/削除/並べ替え/画像添付
	•	計画の自動配分・手動編集・コピー・削除
	•	ログ入力（ページ/問/時間/写真）、編集/削除
	•	グラフの期間変更、クリック遷移
	•	バックアップ/復元（上書き & マージ）

17.2 例外
	•	目標ゼロ日の達成率計算（除外）
	•	画像読込失敗時のフォールバック
	•	IndexedDB未対応（極旧環境）→ read-only警告

17.3 表示
	•	iPhone縦横、iPad横、デスクトップで崩れない
	•	ライト/ダーク/自動切替の反映
	•	長題名・長メモ・大量タグの折返し

⸻

18. 開発段階（マイルストーン）
	•	V2-UI完成（本設計の適用）
	•	AppShell、カード、フォーム、モーダル、タブ
	•	ダッシュボードのダミーデータ描画
	•	参考書カード＋登録モーダル（保存はInMemoryでOK）
	•	V2-Data接続
	•	IndexedDB層/db.js・store.js 完成
	•	books/plans/logsのCRUD
	•	V2-Analytics
	•	charts.jsとダミーデータ→実データ
	•	主要4グラフ完成
	•	V2-Backup
	•	export/importのJSON入出力
	•	V2-Polish
	•	ヒートマップ、トースト、アクセシビリティ、容量警告

⸻

19. 画面遷移・状態遷移（要約）
	•	#btn-save-log → LOGS_CHANGED → state.logs更新 → Analytics再計算 → Dashboard再描画
	•	#btn-save-plan → PLANS_CHANGED → 当日達成率が即時反映
	•	#btn-import-json → 検証 → マージ/上書き → 各*_CHANGED

⸻

20. 将来拡張（V3以降）
	•	PWA対応（Service Worker / Install）
	•	通知（リマインド）・ポモドーロ
	•	タスク難易度学習→自動配分の重み調整
	•	CSV/画像一括取り込み

⸻

付録A：UI要素の厳密仕様（抜粋）
	•	KPIゲージ：円弧180°、0〜150%まで表示、100%超はアクセント色パルス
	•	バッジ縮約ルール：p=12, q=7 のように1文字接頭辞＋数値
	•	フォームの数値入力：ボタンで±1、長押しで連続、Shiftで±5
	•	モーダル幅：モバイル 92vw、タブレット 560px、ラウンド16px
	•	影：soft shadow（y=8, blur=24, α=0.25 相当）

⸻

付録B：バックアップJSON仕様（エクスポート）

{
  "version": "2.0.0",
  "exportedAt": "ISO8601",
  "prefs": { },
  "books": [ ],
  "plans": [ ],
  "logs": [ ],
  "images": [
    {
      "id": "string",
      "type": "image/png",
      "data": "data:image/png;base64,...."
    }
  ]
}

	•	復元時、version差異はマイグレーターで吸収（V2→V3）

⸻

付録C：カラー・スペーシングトークン
	•	スペーシング: --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px
	•	角丸: --radius: 12px; --radius-lg: 16px;
	•	ボーダー: --line: 1px solid rgba(255,255,255,.08)

⸻

付録D：ユニークID規約
	•	book_YYYYMMDDHHmmss_xxx
	•	plan_YYYYMMDD_date
	•	log_YYYYMMDDHHmmss_xxx
	•	img_...
	•	連番ではなくタイムスタンプ＋乱数3桁

⸻

付録E：タグと科目プリセット
	•	科目: 数学, 物理, 化学, 英語, 国語, 地理, 生物, その他
	•	タグ例: 基礎, 仕上げ, 演習, 直前, 苦手, 模試対策, 参考書A

⸻

最後に（実装開始の指針）
	•	まずは**UI骨格（V2見た目）**をindex.html＋base.css＋layout.css＋components.cssで作成（ダミーJSONでチャート描画）
	•	続いてdb.js/store.jsを接続し、CRUD→Dashboard反映
	•	画像まわりとバックアップは最後に統合
