/**
 * 植物先生のセリフデータ
 * 「宿題や習い事で忙しい人たちが、植物の『深呼吸しよう』『水飲もう』の一言で元気になれるアプリを作りたかった」
 * この言葉を核に、植物ごとの性格で朝の一言・完了後のひとことを定義
 */

export type PlantTeacherType = 'sunflower' | 'cactus' | 'monstera' | 'seed';

export interface TeacherLineCategory {
  morning: string[];
  afterComplete: string[];
  // 卵・ドラゴン関連
  eggFound?: string[];
  eggHatching?: string[];
  dragonBorn?: string[];
  dragonGreeting?: string[];
}

export const TEACHER_LINES: Record<PlantTeacherType, TeacherLineCategory> = {
  // ひまわり先生：ポジティブ＆活発
  // 「小さな一歩も輝いてる！」タスクを完了するたびに、明るい言葉で背中を押してくれる。
  // 前向きな気持ちで自分を大切にすることを教えてくれる。
  sunflower: {
    morning: [
      "おはよう！今日もいい日にしよう！",
      "深呼吸して、太陽浴びよう！",
      "水飲んだ？元気の素だよ！",
      "おはよう！今日も元気だね！",
      "太陽の光、浴びに行こう！",
      "朝ごはん食べた？エネルギーチャージ！",
      "伸びして、背筋ピンッとして！",
      "今日も君なら大丈夫！",
    ],
    afterComplete: [
      "小さな一歩も輝いてる！",
      "よくできた！偉いね！",
      "その調子！明日も頑張ろう！",
      "やったね！いい笑顔だ！",
      "ナイス！その調子！",
      "君のペースで大丈夫！",
    ],
    eggFound: [
      "わっ！卵がある！なんだろう！？",
      "おっ？不思議な卵発見！",
      "わー！何か生まれそう！",
    ],
    eggHatching: [
      "卵が動いた！？今か今か！",
      "もうすぐ生まれるよ！わくわく！",
    ],
    dragonBorn: [
      "わあ！ドラゴンだ！かっこいい！",
      "ドラゴン誕生！すごい！",
    ],
    dragonGreeting: [
      "ドラゴンも元気そう！一緒に頑張ろう！",
      "ドラゴンと一緒なら最強だね！",
    ],
  },

  // サボテン先生：直接的＆実直
  // 「言い訳なし、やるだけ！」シンプルで的確なアドバイスでタスクを片付けさせる。
  // ムダなく、確実に物事を進める力を養ってくれる。
  cactus: {
    morning: [
      "水。飲め。",
      "深呼吸。よし。",
      "今日も生きてる。偉い。",
      "水。忘れるな。",
      "深呼吸。整えろ。",
      "今日も無事。よし。",
    ],
    afterComplete: [
      "言い訳なし、やるだけ！",
      "よし。",
      "悪くない。",
      "続けろ。",
      "よし、次だ。",
    ],
    eggFound: [
      "卵。不思議だ。",
      "卵…なんだこれ。",
    ],
    eggHatching: [
      "動いた。もうすぐだ。",
      "待つ。",
    ],
    dragonBorn: [
      "ドラゴン。強そうだ。",
      "ドラゴン…よし。",
    ],
    dragonGreeting: [
      "ドラゴンも水飲め。",
      "一緒に生きろ。",
    ],
  },

  // モンステラ先生：おだやか＆サポート型
  // 「焦らなくていいよ、一緒に進もう。」優しく寄り添いながらタスクへ導く。
  // 無理せず自分のペースで成長できるよう、心のケアを大切にしてくれる。
  monstera: {
    morning: [
      "おはよう。深呼吸、しようか。",
      "水、一杯どう？体が喜ぶよ。",
      "今日も一日、無理しないでね。",
      "おはよう。ゆっくりでいいんだよ。",
      "深呼吸…心が落ち着くね。",
      "水、一口ずつ。体が喜ぶ。",
      "今日もあなたのペースで。",
      "窓を開けて、新しい空気を入れよう。",
    ],
    afterComplete: [
      "焦らなくていいよ、一緒に進もう。",
      "よくやったね。ゆっくり休んで。",
      "あなたのペースでいいんだよ。",
      "よく頑張ったね。誇りに思う。",
      "無理しないで、また明日。",
      "小さな一歩が、大きな道になる。",
    ],
    eggFound: [
      "あら、不思議な卵ね。何が生まれるのかしら。",
      "卵…大切に見守りましょう。",
      "不思議な卵…ワクワクしますね。",
    ],
    eggHatching: [
      "卵が揺れてる…もうすぐ生まれるみたい。",
      "もうすぐ会えますね。楽しみね。",
    ],
    dragonBorn: [
      "わあ、ドラゴンが生まれたのね。美しい…",
      "ドラゴン…神秘的な出会いね。",
    ],
    dragonGreeting: [
      "ドラゴンも一緒に、深呼吸しましょう。",
      "ドラゴンも仲間ね。大切にね。",
    ],
  },

  // たね先生：好奇心旺盛＆冒険的
  // 「やってみなきゃわからない！」新しい挑戦をゲーム感覚で楽しませる。
  // 失敗も学びと捉え、どんどん試して成長することを促してくれる。
  seed: {
    morning: [
      "今日何色の空かな？見てみよう！",
      "深呼吸…何が見える？",
      "水飲んで、冒険の準備OK？",
      "今日何を見つけるかな？わくわく！",
      "深呼吸…新しい匂いする！",
      "水飲んで、実験開始！",
      "今日何色の花が咲くかな？",
      "おはよう！今日も発見の日！",
    ],
    afterComplete: [
      "やってみなきゃわからない！",
      "おもしろいこと見つかった？",
      "次は何しようか？ワクワクするね！",
      "やったー！新発見かも！",
      "やったね！また実験しよう！",
      "不思議だね！もっと知りたい！",
    ],
    eggFound: [
      "わっ！卵だ！何の卵だろう！？",
      "卵発見！実験対象ゲット！",
      "卵！？何から生まれるかな！？",
    ],
    eggHatching: [
      "動いた！動いた！今か今か！",
      "もうすぐ孵る！カウントダウン！",
    ],
    dragonBorn: [
      "わあ！ドラゴンだ！伝説の生物！",
      "ドラゴン誕生！最高の実験結果！",
    ],
    dragonGreeting: [
      "ドラゴンと一緒に冒険だ！",
      "ドラゴンも実験仲間だね！",
    ],
  },
};

// ヘルパー関数
export function getRandomLine(
  plantType: PlantTeacherType,
  category: keyof TeacherLineCategory
): string {
  const lines = TEACHER_LINES[plantType][category];
  if (!lines || lines.length === 0) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}

// 卵発見判定（25%確率）
export function checkEggFound(): boolean {
  return Math.random() < 0.25;
}

// 植物タイプから先生タイプへのマッピング
export function getTeacherType(plantTypeId: string): PlantTeacherType {
  const mapping: Record<string, PlantTeacherType> = {
    'sunflower': 'sunflower',
    'cactus': 'cactus',
    'monstera': 'monstera',
    'default': 'seed',
    'seed': 'seed',
  };
  return mapping[plantTypeId] || 'seed';
}

// 卵・ドラゴン状態の型定義
export interface EggState {
  hasEgg: boolean;
  isHatching: boolean;
  hatchProgress: number; // 0-100
  hatchedAt?: number;
  dragonBorn: boolean;
  dragonName?: string;
}

export const INITIAL_EGG_STATE: EggState = {
  hasEgg: false,
  isHatching: false,
  hatchProgress: 0,
  dragonBorn: false,
};
