'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Copy, CheckCircle, ClipboardList, Share2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  role: string;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.group) {
          setGroup(data.group);
        }
        setLoading(false);
      })
      .catch(() => toast.error('グループの読み込みに失敗しました'));

    fetch(`/api/groups/${id}/members`)
      .then(res => res.json())
      .then(data => {
        if (data.members) {
          setMembers(data.members);
        }
      });
  }, [id]);

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(group?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('招待コードをコピーしました');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>グループが見つかりません</div>
      </div>
    );
  }

  const isOwner = group.role === 'owner';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/groups" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              戻る
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={isOwner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                {isOwner ? '管理者' : 'メンバー'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <p className="text-gray-600">{group.description || '説明なし'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                招待コード
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-lg tracking-wider">
                  {group.inviteCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500">このコードを共有してメンバーを招待できます</p>
              <Button variant="outline" onClick={copyInviteCode} className="w-full mt-2">
                <Share2 className="mr-2 h-4 w-4" />
                コードを共有
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                メンバー ({members.length}人)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center">
                        {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || '名前未設定'}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      member.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                      member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {member.role === 'owner' ? '管理者' : member.role === 'admin' ? '副管理者' : 'メンバー'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                共有課題
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                このグループで共有されている課題はありません
              </p>
              <Button variant="outline" className="w-full mt-4">
                <Plus className="mr-2 h-4 w-4" />
                課題を共有
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
