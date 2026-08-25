'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' },
];

const priorityOptions = [
  { value: 1, label: '低' },
  { value: 2, label: '中' },
  { value: 3, label: '高' },
];

export default function EditAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    priority: 1,
    dueDate: '',
  });

  useEffect(() => {
    fetch(`/api/assignments/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setFormData({
            title: data.title,
            description: data.description || '',
            subject: data.subject || '',
            status: data.status,
            priority: data.priority,
            dueDate: new Date(data.dueDate).toISOString().slice(0, 16),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('課題の読み込みに失敗しました');
        router.push('/dashboard/assignments');
      });
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '更新に失敗しました');
        return;
      }

      toast.success('課題を更新しました');
      router.push('/dashboard/assignments');
      router.refresh();
    } catch {
      toast.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard/assignments" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">課題を編集</h1>
          <p className="text-gray-600 mt-1">課題の詳細を更新してください</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>課題情報</CardTitle>
            <CardDescription>必須項目はすべて入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="例: 数学のレポート課題"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">教科</Label>
                <Input
                  id="subject"
                  placeholder="例: 数学、英語、物理"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="課題の詳細や注意点など"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">進捗状況</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="進捗を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">優先度</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: Number(value) })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="優先度を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">期限 <span className="text-red-500">*</span></Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Link href="/dashboard/assignments">
                  <Button type="button" variant="outline">キャンセル</Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? '更新中...' : '更新する'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
