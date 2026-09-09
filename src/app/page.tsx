import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  
  // ログイン済みはゲームへ
  if (session) {
    redirect('/play');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Questra v0.2.0 — 見習い賢者の冒険録
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-slide-in">
              課題を、<span className="text-primary">冒険</span>として。
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-in" style={{animationDelay: '100ms'}}>
              宿題はモンスター。提出はバトル。<br />
              6つの施設で賢者を目指せ。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{animationDelay: '200ms'}}>
              <a 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                無料で冒険開始
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </a>
              <a 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg border border-input bg-background text-foreground hover:bg-accent transition-colors"
              >
                既にアカウントをお持ちの方
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">6つの施設で冒険を進めよう</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Webメニューはすべて街の施設になりました。</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Facility 1: Bulletin Board */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  📋
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">掲示板</h3>
                <p className="text-muted-foreground mb-4">依頼一覧を確認。モンスター（課題）を選んでバトルへ挑め。</p>
              </div>
            </article>

            {/* Facility 2: Library */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '100ms'}}>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  📚
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">図書館</h3>
                <p className="text-muted-foreground mb-4">新しい依頼（課題）を作成。教科・優先度・期限を設定しよう。</p>
              </div>
            </article>

            {/* Facility 3: Forge */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '200ms'}}>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  ⚒️
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">鍛冶屋</h3>
                <p className="text-muted-foreground mb-4">ゴールドで施設を強化。経験値ボーナスなどの恩恵を受けられる。</p>
              </div>
            </article>

            {/* Facility 4: Shop */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '300ms'}}>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  🏪
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">商店</h3>
                <p className="text-muted-foreground mb-4">消費アイテム・装備・素材を購入。バックパックで所持品を管理。</p>
              </div>
            </article>

            {/* Facility 5: Training Ground */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '400ms'}}>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  🏃
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">訓練場</h3>
                <p className="text-muted-foreground mb-4">ステータス（知力・精神・体力・持久・創造・社交）を確認。称号もここで。</p>
              </div>
            </article>

            {/* Facility 6: Guild */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '500ms'}}>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl">
                  🏰
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">ギルド</h3>
                <p className="text-muted-foreground mb-4">グループ作成・参加、ギルドクエスト。仲間と協力して挑め。</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Game System Overview */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">教科 × 属性 のバトルシステム</h2>
              <p className="text-muted-foreground mb-6 text-lg">
                数学は岩、英語は竜、国語は魔法使い、理科は炎、社会は岩、体育は獣、芸術は猫。<br />
                有利属性で1.5倍ダメージ。特殊行動・必殺技で逆転を狙え。
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">岩: 数学・社会</span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">竜: 英語</span>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium">魔法使い: 国語</span>
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">炎: 理科</span>
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium">獣: 体育</span>
                <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-sm font-medium">猫: 芸術</span>
              </div>
            </div>
            <div className="relative animate-slide-in">
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 via-background to-accent/20 rounded-3xl border p-8 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-32 h-32 mx-auto text-primary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <p className="text-3xl font-bold text-foreground">Quest × Strategy</p>
                  <p className="text-muted-foreground mt-2">タスク管理がRPGになる</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 animate-fade-in">
              今すぐ、冒険を始めよう。
            </h2>
            <p className="text-muted-foreground mb-8 text-lg animate-fade-in" style={{animationDelay: '100ms'}}>
              登録は1分。見習い賢者の仲間入り。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '200ms'}}>
              <a 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                無料アカウント作成
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </a>
              <a 
                href="https://github.com/ryotagtagtag-wq/questra" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg border border-input bg-background text-foreground hover:bg-accent transition-colors"
              >
                GitHubで見る
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Questra v0.2.0 — Questra（クエストラ）〜見習い賢者の冒険録〜</p>
          <p className="mt-1">
            <a href="https://github.com/ryotagtagtag-wq/questra" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a> •
            <a href="https://build.nvidia.com/openai/gpt-oss-120b" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors ml-2">NVIDIA GPT-OSS-120B</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
