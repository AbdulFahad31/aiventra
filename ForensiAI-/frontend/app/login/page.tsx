"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [investigatorId, setInvestigatorId] = React.useState("");
  const [password, setPassword] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("forensiai_investigator", investigatorId || "INV-DEMO");
    toast({ title: "Logged in", description: "Demo session started." });
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/15 p-2 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>ForensiAI</CardTitle>
              <CardDescription>Investigator dashboard</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="investigatorId">Investigator ID</Label>
              <Input
                id="investigatorId"
                value={investigatorId}
                onChange={(event) => setInvestigatorId(event.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="demo"
              />
            </div>
            <Button className="w-full" type="submit" disabled={!investigatorId || !password}>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
