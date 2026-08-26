import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  
  // ログイン済みはダッシュボードへ
  if (session) {
    redirect('/dashboard');
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
              SchoolSync v0.2.0 — AI搭載・課題管理の新定番
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-slide-in">
              課題を、<span className="text-primary">知的に</span>管理する。
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-in" style={{animationDelay: '100ms'}}>
              自然言語でサッと入力、AIが最適な学習順序を提案。<br />
              认知負荷を考慮したスケジューラで、無理なく着実に進められる。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in" style={{animationDelay: '200ms'}}>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                無料で始める
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg border border-input bg-background text-foreground hover:bg-accent transition-colors"
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">3つの核心機能</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">課題管理の「面倒」を、すべて自動化へ。</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: NL Input */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">自然言語で秒速入力</h3>
                <p className="text-muted-foreground mb-4">「明後日の数学レポート」「来週金曜までに英語の課題」——日本語で話しかけるだけで、タイトル・教科・期限・優先度を自動抽出。</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 相対日付（今日/明日/明後日/N日後/曜日）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 具体日付（9/15、9月15日）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 教科辞書対応（数学/英語/国語/理科/情報…）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 確認プレビューで安心</li>
                </ul>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">NEW</span>
              </div>
            </article>

            {/* Feature 2: Scheduler */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '100ms'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">認知負荷適応スケジューラ</h3>
                <p className="text-muted-foreground mb-4">締切・教科ごとの認知負荷・完了履歴・教科の偏り・期限超過を5つのヒューリスティックでスコアリング。あなたに最適な「今やるべき順序」を提示。</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 締切プレッシャー（40%）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 認知負荷バランス（20%）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 遅延パターン学習（15%）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 教科多様性・ポモドーロ推奨</li>
                </ul>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">NEW</span>
              </div>
            </article>

            {/* Feature 3: Core Features */}
            <article className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-slide-in" style={{animationDelay: '200ms'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">基本機能も充実</h3>
                <p className="text-muted-foreground mb-4">カレンダー表示、グループ共有（招待コード）、通知（Vercel Cron）、ダークモード——学生生活に必要なすべてを標準搭載。</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 月/週カレンダー・ドラッグ操作</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> グループ共有・招待コード</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 期限リマインダー（毎朝9時）</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> NextAuth v5・Google OAuth</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Tech Stack / AI Powered */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">NVIDIA GPT-OSS-120B 搭載</h2>
              <p className="text-muted-foreground mb-6 text-lg">
                117BパラメータのMixture-of-Expertsモデルを、NVIDIA Build API経由で活用。<br />
                開発者プログラムエンジニアとして永久無料枠で運用可能。
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Next.js 16 (App Router)</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">React 19</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">TypeScript</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Drizzle ORM</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">PostgreSQL (Neon)</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Tailwind CSS</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Vercel Deploy</span>
              </div>
            </div>
            <div className="relative animate-slide-in">
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 via-background to-accent/20 rounded-3xl border p-8 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-32 h-32 mx-auto text-primary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <p className="text-3xl font-bold text-foreground">AI Powered</p>
                  <p className="text-muted-foreground mt-2">自然言語解析 + パーソナライズドスケジューリング</p>
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
              今すぐ、賢く課題管理を始めよう。
            </h2>
            <p className="text-muted-foreground mb-8 text-lg animate-fade-in" style={{animationDelay: '100ms'}}>
              登録は1分。Googleアカウントで即座に開始できます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '200ms'}}>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                無料アカウント作成
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              </Link>
              <Link 
                href="https://github.com/ryotagtagtag-wq/schoolsync" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold rounded-lg border border-input bg-background text-foreground hover:bg-accent transition-colors"
              >
                GitHubで見る
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SchoolSync v0.2.0 — Built with Next.js 16, Drizzle, Neon, Vercel</p>
          <p className="mt-1">
            <a href="https://github.com/ryotagtagtag-wq/schoolsync" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a> •
            <a href="https://build.nvidia.com/openai/gpt-oss-120b" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors ml-2">NVIDIA GPT-OSS-120B</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
