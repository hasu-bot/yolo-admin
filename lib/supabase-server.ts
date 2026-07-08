import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が未設定です。.env.local を作成し Supabase のキーを設定してください（.env.local.example 参照）。`
    );
  }
  return value;
}

/**
 * yolo-platform Supabase への特権クライアント（service roleキー）。
 * yolo-admin はサーバーサイド（Route Handlers / Server Components）でのみ使用し、
 * このキーをクライアントへ渡さないこと。
 */
export function getServiceClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getServiceClient はサーバー専用です。");
  }
  return createClient(assertEnv(url, "NEXT_PUBLIC_SUPABASE_URL"), assertEnv(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}
