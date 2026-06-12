import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>深圳市富泰科技有限公司</CardTitle>
            <CardDescription>GZ-001 · 深圳 · 福田区</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <span className="bg-success-bg text-success-fg text-xs px-2 py-0.5 rounded-sm">战略合作</span>
              <span className="bg-info-bg text-info-fg text-xs px-2 py-0.5 rounded-sm">常规</span>
              <span className="bg-warning-bg text-warning-fg text-xs px-2 py-0.5 rounded-sm">试单</span>
              <span className="bg-danger-bg text-danger-fg text-xs px-2 py-0.5 rounded-sm">暂停</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">公司名</Label>
              <Input id="name" placeholder="输入供应商名称" />
            </div>

            <div className="flex gap-2">
              <Button>主操作</Button>
              <Button variant="secondary">次要操作</Button>
              <Button variant="outline">轮廓按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="destructive">危险操作</Button>
            </div>

            <div className="flex gap-2">
              <Badge>默认</Badge>
              <Badge variant="secondary">次要</Badge>
              <Badge variant="outline">轮廓</Badge>
              <Badge variant="destructive">危险</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}